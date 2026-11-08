import { z } from "zod";
import { NotificationPriorityEnum, NotificationTypeEnum } from "./notification.model";

export const notificationIdSchema = z.string().trim().min(1, "Notification ID is required");

export const createNotificationSchema = z.object({
  recipient: z.string().trim().min(1, "Recipient ID is required"),
  workspaceId: z.string().trim().optional().nullable(),
  type: z
    .nativeEnum(NotificationTypeEnum)
    .optional()
    .default(NotificationTypeEnum.GENERAL),
  title: z.string().trim().min(1, "Title is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(1000),
  data: z.record(z.any()).optional().default({}),
  priority: z
    .nativeEnum(NotificationPriorityEnum)
    .optional()
    .default(NotificationPriorityEnum.MEDIUM),
  sendEmail: z.boolean().optional().default(false),
});

export const createBulkNotificationSchema = z.object({
  recipients: z.array(z.string().trim().min(1)).min(1, "At least one recipient is required"),
  workspaceId: z.string().trim().optional().nullable(),
  type: z
    .nativeEnum(NotificationTypeEnum)
    .optional()
    .default(NotificationTypeEnum.GENERAL),
  title: z.string().trim().min(1, "Title is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(1000),
  data: z.record(z.any()).optional().default({}),
  priority: z
    .nativeEnum(NotificationPriorityEnum)
    .optional()
    .default(NotificationPriorityEnum.MEDIUM),
  sendEmail: z.boolean().optional().default(false),
});

export const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  isRead: z
    .preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
  workspaceId: z.string().trim().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type CreateBulkNotificationInput = z.infer<typeof createBulkNotificationSchema>;
export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;

