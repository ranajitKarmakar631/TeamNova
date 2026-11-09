import mongoose, { Document, Schema } from "mongoose";

export enum NotificationTypeEnum {
  TASK_ASSIGNED = "TASK_ASSIGNED",
  TASK_STATUS_CHANGED = "TASK_STATUS_CHANGED",
  TASK_PRIORITY_CHANGED = "TASK_PRIORITY_CHANGED",
  TASK_DELETED = "TASK_DELETED",
  WORKSPACE_INVITE = "WORKSPACE_INVITE",
  WORKSPACE_MEMBER_JOINED = "WORKSPACE_MEMBER_JOINED",
  PROJECT_MEMBER_ADDED = "PROJECT_MEMBER_ADDED",
  TEAM_MEMBER_ADDED = "TEAM_MEMBER_ADDED",
  CHAT_MESSAGE = "CHAT_MESSAGE",
  GENERAL = "GENERAL",
  MEETING_INVITE = "MEETING_INVITE",
  MEETING_REMINDER = "MEETING_REMINDER",
  MEETING_STARTED = "MEETING_STARTED",
  MEETING_CANCELLED = "MEETING_CANCELLED",
  MEETING_RESCHEDULED = "MEETING_RESCHEDULED",
}

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_PRIORITY_CHANGED"
  | "TASK_DELETED"
  | "WORKSPACE_INVITE"
  | "WORKSPACE_MEMBER_JOINED"
  | "PROJECT_MEMBER_ADDED"
  | "TEAM_MEMBER_ADDED"
  | "CHAT_MESSAGE"
  | "GENERAL"
  | "MEETING_INVITE"
  | "MEETING_REMINDER"
  | "MEETING_STARTED"
  | "MEETING_CANCELLED"
  | "MEETING_RESCHEDULED";

export enum NotificationPriorityEnum {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface NotificationDocument extends Document {
  recipient: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId | null;
  workspace: mongoose.Types.ObjectId | null;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  readAt: Date | null;
  priority: NotificationPriority;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationTypeEnum),
      default: NotificationTypeEnum.GENERAL,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriorityEnum),
      default: NotificationPriorityEnum.MEDIUM,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal querying
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, workspace: 1, createdAt: -1 });

const NotificationModel = mongoose.model<NotificationDocument>(
  "Notification",
  notificationSchema
);

export default NotificationModel;

