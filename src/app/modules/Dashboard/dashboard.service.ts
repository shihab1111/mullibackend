import { User } from '../user/user.model';
import { Match } from '../Liked/match.model';
import { Post, Comment } from '../Clubhouse/clubhouse.model';
import { Swipe } from '../Swipe/swipe.model';
import { Message } from '../chat/chat.model';

const getDashboardStats = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Users stats
  const totalUsers = await User.countDocuments();
  const lastMonthUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
  const prevMonthUsers = await User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });

  let usersPercentChange = 0;
  if (prevMonthUsers > 0) {
    usersPercentChange = ((lastMonthUsers - prevMonthUsers) / prevMonthUsers) * 100;
  } else if (lastMonthUsers > 0) {
    usersPercentChange = 100;
  }
  
  // Matches stats
  const totalMatches = await Match.countDocuments();
  const lastMonthMatches = await Match.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
  const prevMonthMatches = await Match.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });
  
  let matchesPercentChange = 0;
  if (prevMonthMatches > 0) {
    matchesPercentChange = ((lastMonthMatches - prevMonthMatches) / prevMonthMatches) * 100;
  } else if (lastMonthMatches > 0) {
    matchesPercentChange = 100;
  }

  // Generate last 7 days starting from today (current day at front)
  const last7Days: any[] = [];
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i); // i=0 is today, i=1 is yesterday, etc.
    const dateString = d.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const dayName = daysOfWeek[d.getDay()];
    last7Days.push({
      date: dateString,
      dayName,
      golfBuddyMatches: 0,
      golfDateMatches: 0
    });
  }

  // Get date 7 days ago at midnight for the query
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 6 days ago + today = 7 days
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const matchCountsByDay = await Match.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'users',
        foreignField: '_id',
        as: 'matchUsers'
      }
    },
    {
      $addFields: {
        playstyle: { $arrayElemAt: ['$matchUsers.playstyle', 0] },
        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
      }
    },
    {
      $group: {
        _id: '$date',
        golfBuddyMatches: {
          $sum: { $cond: [{ $eq: ['$playstyle', 'Golf_Buddy'] }, 1, 0] }
        },
        golfDateMatches: {
          $sum: { $cond: [{ $eq: ['$playstyle', 'Golf_Date'] }, 1, 0] }
        }
      }
    }
  ]);

  // Merge aggregation results into the default 7 days array
  const weeklyMatchesGraph = last7Days.map(dayObj => {
    const matchData = matchCountsByDay.find(m => m._id === dayObj.date);
    if (matchData) {
      return {
        ...dayObj,
        golfBuddyMatches: matchData.golfBuddyMatches || 0,
        golfDateMatches: matchData.golfDateMatches || 0
      };
    }
    return dayObj;
  });

  // Top Clubhouse Categories
  const topClubhouseCategories = await Post.aggregate([
    {
      $group: {
        _id: '$category',
        totalPosts: { $sum: 1 },
        uniqueUsers: { $addToSet: '$author' }
      }
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        totalPosts: 1,
        totalUsers: { $size: '$uniqueUsers' }
      }
    },
    { $sort: { totalPosts: -1 } }
  ]);

  return {
    totalUsers,
    usersPercentChange: Math.round(usersPercentChange * 100) / 100,
    totalMatches,
    matchesPercentChange: Math.round(matchesPercentChange * 100) / 100,
    weeklyMatchesGraph,
    topClubhouseCategories
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/** Haversine distance in km between two [lng, lat] coordinate pairs */
const haversineKm = (
  [lng1, lat1]: number[],
  [lng2, lat2]: number[]
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

type Cluster = {
  lat: number;
  lng: number;
  placeName: string;
  userCount: number;
};

/** Cluster an array of {coordinates:[lng,lat], placeName} points within radius km */
const clusterLocations = (
  points: { coordinates: number[]; placeName?: string }[],
  radiusKm = 1
): Cluster[] => {
  const clusters: Cluster[] = [];
  for (const pt of points) {
    const coords = pt.coordinates;
    if (!coords || (coords[0] === 0 && coords[1] === 0)) continue;
    const [lng, lat] = coords;
    const existing = clusters.find(c => haversineKm([c.lng, c.lat], [lng, lat]) <= radiusKm);
    if (existing) {
      const n = existing.userCount;
      existing.lat = (existing.lat * n + lat) / (n + 1);
      existing.lng = (existing.lng * n + lng) / (n + 1);
      existing.userCount += 1;
    } else {
      clusters.push({ lat, lng, placeName: pt.placeName ?? 'Unknown', userCount: 1 });
    }
  }
  return clusters.sort((a, b) => b.userCount - a.userCount);
};

// ─────────────────────────────────────────────────────────────────────────────
// CLUBHOUSE WEEKLY ENGAGEMENT
// Returns 7 days + matchSuccessRate + messageAfterMatchRate + topLocations
// ─────────────────────────────────────────────────────────────────────────────
const getClubhouseWeeklyEngagement = async () => {
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Build 7-day scaffold (today is index 6, 6 days ago is index 0)
  const scaffold: {
    date: string;
    dayName: string;
    totalPosts: number;
    totalComments: number;
    totalLikes: number;
  }[] = [];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    scaffold.push({
      date: d.toISOString().split('T')[0],
      dayName: DAY_NAMES[d.getDay()],
      totalPosts: 0,
      totalComments: 0,
      totalLikes: 0,
    });
  }

  // Aggregate posts per day (count + sum likes)
  const postsByDay = await Post.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        totalPosts: { $sum: 1 },
        totalLikes: { $sum: '$likesCount' },
      },
    },
  ]);

  // Aggregate comments per day
  const commentsByDay = await Comment.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        totalComments: { $sum: 1 },
      },
    },
  ]);

  // Merge into scaffold
  const weeklyEngagement = scaffold.map(day => {
    const postData = postsByDay.find(p => p._id === day.date);
    const commentData = commentsByDay.find(c => c._id === day.date);
    return {
      ...day,
      totalPosts: postData?.totalPosts ?? 0,
      totalLikes: postData?.totalLikes ?? 0,
      totalComments: commentData?.totalComments ?? 0,
    };
  });

  // ── Match Success Rate: this month vs last month ───────────────────────────
  const now = new Date();

  // This month: 1st of current month → now
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Last month: 1st → last day of previous month
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const calcSuccessRate = async (from: Date, to: Date) => {
    const [totalLikesCount, matchedLikesCount] = await Promise.all([
      Swipe.countDocuments({ action: 'like', createdAt: { $gte: from, $lte: to } }),
      Swipe.countDocuments({ action: 'like', status: 'matched', createdAt: { $gte: from, $lte: to } }),
    ]);
    return totalLikesCount > 0
      ? Math.round((matchedLikesCount / totalLikesCount) * 10000) / 100  // 2 decimal places
      : 0;
  };

  const [thisMonthRate, lastMonthRate] = await Promise.all([
    calcSuccessRate(thisMonthStart, now),
    calcSuccessRate(lastMonthStart, lastMonthEnd),
  ]);

  const rateDiff   = Math.round((thisMonthRate - lastMonthRate) * 100) / 100;
  const direction  = rateDiff > 0 ? 'up' : rateDiff < 0 ? 'down' : 'unchanged';
  const absDiff    = Math.abs(rateDiff);

  let matchSuccessMessage: string;
  if (direction === 'up') {
    matchSuccessMessage = `Match success rate is up ${absDiff}% this month (${thisMonthRate}%) compared to last month (${lastMonthRate}%).`;
  } else if (direction === 'down') {
    matchSuccessMessage = `Match success rate is down ${absDiff}% this month (${thisMonthRate}%) compared to last month (${lastMonthRate}%).`;
  } else {
    matchSuccessMessage = `Match success rate is unchanged at ${thisMonthRate}% compared to last month.`;
  }

  // ── Message-after-match rate: % of matched pairs that exchanged ≥1 message ─
  const calcMessageRate = async (from: Date, to: Date) => {
    // Matches created in the window
    const matchPairs = await Match.find(
      { createdAt: { $gte: from, $lte: to } },
      { user1: 1, user2: 1 }
    ).lean();

    if (matchPairs.length === 0) return 0;

    // Count how many pairs have at least one message in either direction
    let conversing = 0;
    for (const pair of matchPairs) {
      const hasMessage = await Message.exists({
        $or: [
          { sender: pair.user1, receiver: pair.user2 },
          { sender: pair.user2, receiver: pair.user1 },
        ],
      });
      if (hasMessage) conversing++;
    }
    return Math.round((conversing / matchPairs.length) * 10000) / 100;
  };

  const [thisMonthMsgRate, lastMonthMsgRate] = await Promise.all([
    calcMessageRate(thisMonthStart, now),
    calcMessageRate(lastMonthStart, lastMonthEnd),
  ]);

  const msgRateDiff  = Math.round((thisMonthMsgRate - lastMonthMsgRate) * 100) / 100;
  const msgDirection = msgRateDiff > 0 ? 'up' : msgRateDiff < 0 ? 'down' : 'unchanged';
  const absMsgDiff   = Math.abs(msgRateDiff);

  let messageAfterMatchMessage: string;
  if (msgDirection === 'up') {
    messageAfterMatchMessage = `Post-match messaging rate is up ${absMsgDiff}% this month (${thisMonthMsgRate}%) compared to last month (${lastMonthMsgRate}%).`;
  } else if (msgDirection === 'down') {
    messageAfterMatchMessage = `Post-match messaging rate is down ${absMsgDiff}% this month (${thisMonthMsgRate}%) compared to last month (${lastMonthMsgRate}%).`;
  } else {
    messageAfterMatchMessage = `Post-match messaging rate is unchanged at ${thisMonthMsgRate}% compared to last month.`;
  }

  // ── Top Locations: active users clustered within 1 km ──────────────────────
  const activeUsers = await User.find(
    { useLocation: true, 'location.coordinates': { $exists: true } },
    { 'location.coordinates': 1, 'location.placeName': 1 }
  ).lean();

  const locationPoints = activeUsers.map((u: any) => ({
    coordinates: u.location?.coordinates ?? [0, 0],
    placeName: u.location?.placeName,
  }));

  const topLocations = clusterLocations(locationPoints);

  return {
    weeklyEngagement,
    matchSuccessRate: {
      thisMonth: thisMonthRate,
      lastMonth: lastMonthRate,
      change: rateDiff,
      direction,
      message: matchSuccessMessage,
    },
    messageAfterMatchRate: {
      thisMonth: thisMonthMsgRate,
      lastMonth: lastMonthMsgRate,
      change: msgRateDiff,
      direction: msgDirection,
      message: messageAfterMatchMessage,
    },
    topLocations,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CLUBHOUSE REPORTS
// Returns all reports with reportName, postId, date, user
// ─────────────────────────────────────────────────────────────────────────────
const getClubhouseReports = async () => {
  const reports = await Post.aggregate([
    { $match: { 'reports.0': { $exists: true } } },
    { $unwind: '$reports' },
    {
      $lookup: {
        from: 'users',
        localField: 'reports.user',
        foreignField: '_id',
        as: 'reporterInfo',
      },
    },
    { $unwind: { path: '$reporterInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        postId: '$_id',
        reportName: '$reports.type',
        date: '$reports.reportedAt',
        user: {
          _id: '$reporterInfo._id',
          name: { $ifNull: ['$reporterInfo.name', { $concat: [{ $ifNull: ['$reporterInfo.firstName', ''] }, ' ', { $ifNull: ['$reporterInfo.lastName', ''] }] }] },
          profileImage: '$reporterInfo.profileImage',
        },
      },
    },
    { $sort: { date: -1 } },
  ]);

  return { reports };
};

export const DashboardService = {
  getDashboardStats,
  getClubhouseWeeklyEngagement,
  getClubhouseReports,
};
