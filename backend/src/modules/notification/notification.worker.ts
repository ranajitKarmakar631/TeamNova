import { Worker, Job } from "bullmq";
import { getRedisConfig } from "../../config/redis.config";
import {
  NOTIFICATION_QUEUE_NAME,
  NotificationJobType,
  NotificationJobData,
  BulkNotificationJobData,
} from "./notification.queue";
import { notificationService } from "./notification.service";

let notificationWorker: Worker | null = null;

export const initNotificationWorker = (): Worker => {
  if (notificationWorker) {
    return notificationWorker;
  }

  const redisConfig = getRedisConfig();

  notificationWorker = new Worker(
    NOTIFICATION_QUEUE_NAME,
    async (job: Job) => {
      console.log(
        `[Notification Worker] Processing job ${job.id} (name: ${job.name})`
      );

      switch (job.name) {
        case NotificationJobType.SEND_NOTIFICATION: {
          const data = job.data as NotificationJobData;
          return await notificationService.processAndSaveNotification(data);
        }

        case NotificationJobType.SEND_BULK_NOTIFICATIONS: {
          const data = job.data as BulkNotificationJobData;
          return await notificationService.processAndSaveBulkNotifications(data);
        }

        default:
          throw new Error(`Unknown notification job type: ${job.name}`);
      }
    },
    {
      connection: redisConfig,
      concurrency: 5,
    }
  );

  notificationWorker.on("completed", (job: Job) => {
    console.log(
      `[Notification Worker] Job ${job.id} (${job.name}) completed successfully`
    );
  });

  notificationWorker.on("failed", (job: Job | undefined, err: Error) => {
    console.error(
      `[Notification Worker] Job ${job?.id} failed with error:`,
      err.message
    );
  });

  notificationWorker.on("error", (err: Error) => {
    console.error("[Notification Worker] Error:", err.message);
  });

  console.log("[Notification Worker] Initialized and listening for jobs");
  return notificationWorker;
};

export const closeNotificationWorker = async (): Promise<void> => {
  if (notificationWorker) {
    try {
      await notificationWorker.close();
      notificationWorker = null;
      console.log("[Notification Worker] Closed successfully");
    } catch (error) {
      console.error("[Notification Worker] Failed to close:", error);
    }
  }
};

