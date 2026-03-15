export interface IDashboardStats {
  totalUsers: number;
  usersPercentChange: number;
  totalMatches: number;
  matchesPercentChange: number;
  weeklyMatchesGraph: {
    date: string;
    dayName: string;
    golfBuddyMatches: number;
    golfDateMatches: number;
  }[];
  topClubhouseCategories: {
    category: string;
    totalPosts: number;
    totalUsers: number;
  }[];
}
