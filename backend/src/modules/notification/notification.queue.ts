import { Queue } from "bullmq";
import { getRedisConfig } from "../../config/redis.config";
import { NotificationPriority, NotificationType } from "./notification.model";

export const NOTIFICATION_QUEUE_NAME = "notification-queue";

export enum NotificationJobType {
  SEND_NOTIFICATION = "send-notification",
  SEND_BULK_NOTIFICATIONS = "send-bulk-notifications",
}

export interface NotificationJobData {
  recipient: string;
  sender?: string | null;
  workspaceId?: string | null;
  type?: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  sendEmail?: boolean;
}

export interface BulkNotificationJobData {
  recipients: string[];
  sender?: string | null;
  workspaceId?: string | null;
  type?: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  sendEmail?: boolean;
}

const redisConfig = getRedisConfig();

export const notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      count: 500,
    },
    removeOnFail: {
      count: 1000,
    },
  },
});

notificationQueue.on("error", (err: Error) => {
  console.error("[Notification Queue] Error:", err.message);
});

export const addNotificationJob = async (
  data: NotificationJobData,
  opts?: { delay?: number }
) => {
  return await notificationQueue.add(
    NotificationJobType.SEND_NOTIFICATION,
    data,
    {
      ...opts,
      priority:
        data.priority === "URGENT"
          ? 1
          : data.priority === "HIGH"
          ? 2
          : data.priority === "MEDIUM"
          ? 3
          : 4,
    }
  );
};

export const addBulkNotificationJob = async (
  data: BulkNotificationJobData,
  opts?: { delay?: number }
) => {
  return await notificationQueue.add(
    NotificationJobType.SEND_BULK_NOTIFICATIONS,
    data,
    {
      ...opts,
      priority:
        data.priority === "URGENT"
          ? 1
          : data.priority === "HIGH"
          ? 2
          : data.priority === "MEDIUM"
          ? 3
          : 4,
    }
  );
};

export const closeNotificationQueue = async (): Promise<void> => {
  try {
    await notificationQueue.close();
    console.log("[Notification Queue] Closed successfully");
  } catch (error) {
    console.error("[Notification Queue] Failed to close:", error);
  }
};

