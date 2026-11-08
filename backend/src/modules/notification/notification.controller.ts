import { Request, Response } from "express";
import { asyncHandler } from "../../common/middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import { notificationService } from "./notification.service";
import {
  createBulkNotificationSchema,
  createNotificationSchema,
  getNotificationsQuerySchema,
  notificationIdSchema,
} from "./notification.validation";

export const getUserNotificationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();
    const query = getNotificationsQuerySchema.parse(req.query);

    const result = await notificationService.getUserNotifications(
      userId,
      query
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Notifications fetched successfully",
      ...result,
    });
  }
);

export const getUnreadCountController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();
    const workspaceId = req.query.workspaceId as string | undefined;

    const result = await notificationService.getUnreadCount(
      userId,
      workspaceId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Unread notification count fetched successfully",
      ...result,
    });
  }
);

export const markAsReadController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();
    const notificationId = notificationIdSchema.parse(req.params.id);

    const result = await notificationService.markAsRead(
      notificationId,
      userId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Notification marked as read",
      ...result,
    });
  }
);

export const markAllAsReadController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();
    const workspaceId =
      (req.body.workspaceId as string | undefined) ||
      (req.query.workspaceId as string | undefined);

    const result = await notificationService.markAllAsRead(
      userId,
      workspaceId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "All notifications marked as read",
      ...result,
    });
  }
);

export const deleteNotificationController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();
    const notificationId = notificationIdSchema.parse(req.params.id);

    const result = await notificationService.deleteNotification(
      notificationId,
      userId
    );

    return res.status(HTTPSTATUS.OK).json(result);
  }
);

export const clearAllNotificationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();
    const workspaceId =
      (req.body.workspaceId as string | undefined) ||
      (req.query.workspaceId as string | undefined);

    const result = await notificationService.clearAllNotifications(
      userId,
      workspaceId
    );

    return res.status(HTTPSTATUS.OK).json(result);
  }
);

export const sendNotificationController = asyncHandler(
  async (req: Request, res: Response) => {
    const senderId = req.user?._id?.toString();
    const body = createNotificationSchema.parse(req.body);

    const result = await notificationService.queueNotification({
      ...body,
      sender: senderId,
    });

    return res.status(HTTPSTATUS.ACCEPTED).json({
      message: "Notification queued successfully",
      ...result,
    });
  }
);

export const sendBulkNotificationController = asyncHandler(
  async (req: Request, res: Response) => {
    const senderId = req.user?._id?.toString();
    const body = createBulkNotificationSchema.parse(req.body);

    const result = await notificationService.queueBulkNotifications({
      ...body,
      sender: senderId,
    });

    return res.status(HTTPSTATUS.ACCEPTED).json({
      message: "Bulk notifications queued successfully",
      ...result,
    });
  }
);

