/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";

export enum NotificationType {

  CHAT_MESSAGE = "CHAT_MESSAGE",
  FEEDBACK_SUBMITTED = "FEEDBACK_SUBMITTED",
  SYSTEM = "SYSTEM",
}

export interface INotificationData {
  locationId?: string;
  chatId?: string;
  senderId?: string;
  receiverId?: string;
  deepLink?: string;
  [key: string]: any;
}

export interface INotification {
  _id?: Types.ObjectId;
  user: Types.ObjectId; // receiver user id
  type: NotificationType;
  title: string;
  body: string;
  data?: INotificationData;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
