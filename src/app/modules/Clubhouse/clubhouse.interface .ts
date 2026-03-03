import { Types, Document } from "mongoose";

// --- ENUMS ---
export enum PostCategory {
  FIND_GOLF_BUDDY = "find_golf_buddy",
  RATE_MY_SWING = "rate_my_swing",
  LOCAL_CHATTER = "local_chatter",
  EXPERTS_ONLY = "experts_only",
  LADIES_ONLY = "ladies_only",
}

export enum PostType {
  PLAY = "play",
  PRACTICE = "practice",
  MATCH = "match",
}

export enum PlayStyle {
  QUICK_3 = "quick_3",
  QUICK_4 = "quick_4",
  SOCIAL_SLOW = "social_slow",
}

export enum Mobility {
  WALKING = "walking",
  CART = "cart",
}

export enum Conversation {
  QUIET_FOCUSED = "quiet_focused",
  FRIENDLY_RESPECTFUL = "friendly_respectful",
  CHILL_CHATTY = "chill_chatty",
}

export enum PostRoundInterest {
  GRAB_DRINK = "grab_drink",
  PRACTICE_MORE = "practice_more",
  HEAD_HOME = "head_home",
}

export enum Visibility {
  PUBLIC = "public",
  FRIENDS = "friends",
  PRIVATE = "private",
}

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  GIF = "gif",
}

// --- SUB-INTERFACES ---
export interface IVibe {
  music?: boolean;
  beerCart?: boolean;
  smoker?: boolean;
  mulligans?: boolean;
  gimmies?: boolean;
}

export interface IPlayDetails {
  golfCourse?: string;
  facilities?: string[];
  location?: string;
  flexibleLocation?: boolean;
  date?: Date;
  time?: string;
  playersNeeded?: number;
  playStyle?: PlayStyle;
  mobility?: Mobility;
  conversation?: Conversation;
  vibe?: IVibe;
  postRoundInterest?: PostRoundInterest;
  notes?: string;
}

export interface IComment {
  user: Types.ObjectId;
  post: Types.ObjectId;
  text: string;
  parentId?: Types.ObjectId;
  likes: Types.ObjectId[];
  likesCount: number;
}

export interface ICommentDocument extends IComment, Document {
  createdAt: Date;
  updatedAt: Date;
}

// --- MAIN INTERFACE ---
export interface IClubhouse {
  author: Types.ObjectId;
  category: PostCategory;
  postType: PostType;
  playDetails?: IPlayDetails;
  visibility: Visibility;
  whatsOnYourMind?: string;
  media: {
    type: MediaType;
    url: string;
  }[];
  likes: Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  gifts: {
    user: Types.ObjectId;
    giftType: string;
    sentAt: Date;
  }[];
  backgroundColor?: string;
}

export interface IClubhouseDocument extends IClubhouse, Document {
  createdAt: Date;
  updatedAt: Date;
}