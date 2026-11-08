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
  | "GENERAL";

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface NotificationSenderType {
  _id: string;
  name?: string;
  email: string;
  profilePicture?: string | null;
}

export interface NotificationWorkspaceType {
  _id: string;
  name: string;
}

export interface NotificationItemType {
  _id: string;
  recipient: string;
  sender?: NotificationSenderType | null;
  workspace?: NotificationWorkspaceType | null;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  readAt?: string | null;
  priority: NotificationPriority;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsPaginationType {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationsResponseType {
  message: string;
  notifications: NotificationItemType[];
  pagination: NotificationsPaginationType;
}

export interface UnreadCountResponseType {
  message: string;
  unreadCount: number;
}

