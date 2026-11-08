import mongoose from "mongoose";
import NotificationModel, {
  NotificationDocument,
  NotificationPriorityEnum,
  NotificationTypeEnum,
} from "./notification.model";
import UserModel from "../user/user.model";
import {
  NotFoundException,
  BadRequestException,
} from "../../common/utils/appError";
import {
  addNotificationJob,
  addBulkNotificationJob,
  NotificationJobData,
  BulkNotificationJobData,
} from "./notification.queue";
import {
  sendNotificationViaSocket,
  sendUnreadCountViaSocket,
  sendNotificationReadViaSocket,
  sendAllNotificationsReadViaSocket,
  sendNotificationDeletedViaSocket,
} from "./notification.socket";
import { sendEmail } from "../../config/sendMail";
import { GetNotificationsQuery } from "./notification.validation";

export class NotificationService {
  /**
   * Queue a single notification for asynchronous processing and delivery
   */
  public async queueNotification(
    data: NotificationJobData,
    opts?: { delay?: number }
  ) {
    if (!mongoose.isValidObjectId(data.recipient)) {
      throw new BadRequestException("Invalid recipient ID provided");
    }

    if (data.sender && !mongoose.isValidObjectId(data.sender)) {
      throw new BadRequestException("Invalid sender ID provided");
    }

    if (data.workspaceId && !mongoose.isValidObjectId(data.workspaceId)) {
      throw new BadRequestException("Invalid workspace ID provided");
    }

    const job = await addNotificationJob(data, opts);
    return {
      success: true,
      jobId: job.id,
      recipient: data.recipient,
      title: data.title,
    };
  }

  /**
   * Queue notifications for multiple recipients
   */
  public async queueBulkNotifications(
    data: BulkNotificationJobData,
    opts?: { delay?: number }
  ) {
    if (!data.recipients || data.recipients.length === 0) {
      throw new BadRequestException("No recipients provided");
    }

    const invalidRecipient = data.recipients.find(
      (id) => !mongoose.isValidObjectId(id)
    );
    if (invalidRecipient) {
      throw new BadRequestException(`Invalid recipient ID: ${invalidRecipient}`);
    }

    const job = await addBulkNotificationJob(data, opts);
    return {
      success: true,
      jobId: job.id,
      recipientCount: data.recipients.length,
      title: data.title,
    };
  }

  /**
   * Worker processor: Persists a notification to MongoDB, emits socket event, and sends email if configured
   */
  public async processAndSaveNotification(
    data: NotificationJobData
  ): Promise<NotificationDocument> {
    const notification = await NotificationModel.create({
      recipient: new mongoose.Types.ObjectId(data.recipient),
      sender: data.sender ? new mongoose.Types.ObjectId(data.sender) : null,
      workspace: data.workspaceId
        ? new mongoose.Types.ObjectId(data.workspaceId)
        : null,
      type: data.type || NotificationTypeEnum.GENERAL,
      title: data.title,
      message: data.message,
      data: data.data || {},
      priority: data.priority || NotificationPriorityEnum.MEDIUM,
      isRead: false,
    });

    const populatedNotification = await NotificationModel.findById(
      notification._id
    )
      .populate("sender", "_id name email profilePicture")
      .populate("workspace", "_id name");

    const payload = populatedNotification || notification;

    // Calculate updated unread count for recipient
    const unreadCount = await NotificationModel.countDocuments({
      recipient: data.recipient,
      isRead: false,
    });

    // Deliver via real-time WebSocket
    sendNotificationViaSocket(data.recipient, payload);
    sendUnreadCountViaSocket(data.recipient, unreadCount);

    // Optional email delivery
    if (data.sendEmail || data.priority === NotificationPriorityEnum.URGENT) {
      try {
        const user = await UserModel.findById(data.recipient);
        if (user?.email) {
          await sendEmail({
            to: user.email,
            subject: `[TaskNova] ${data.title}`,
            text: data.message,
            html: `
              <div style="font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333;">
                <h2 style="color: #4f46e5;">${data.title}</h2>
                <p>${data.message}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #777;">
                  You received this notification from your TaskNova workspace.
                </p>
              </div>
            `,
          });
        }
      } catch (err) {
        console.warn(
          `[Notification Worker] Failed to send email to user ${data.recipient}:`,
          (err as Error).message
        );
      }
    }

    return payload;
  }

  /**
   * Worker processor: Persists multiple notifications to MongoDB and delivers to each user
   */
  public async processAndSaveBulkNotifications(
    data: BulkNotificationJobData
  ): Promise<{ insertedCount: number }> {
    const docs = data.recipients.map((recipientId) => ({
      recipient: new mongoose.Types.ObjectId(recipientId),
      sender: data.sender ? new mongoose.Types.ObjectId(data.sender) : null,
      workspace: data.workspaceId
        ? new mongoose.Types.ObjectId(data.workspaceId)
        : null,
      type: data.type || NotificationTypeEnum.GENERAL,
      title: data.title,
      message: data.message,
      data: data.data || {},
      priority: data.priority || NotificationPriorityEnum.MEDIUM,
      isRead: false,
    }));

    const createdDocs = await NotificationModel.insertMany(docs);

    // Send real-time socket events to each recipient
    await Promise.all(
      createdDocs.map(async (doc) => {
        const recipientId = doc.recipient.toString();
        const unreadCount = await NotificationModel.countDocuments({
          recipient: recipientId,
          isRead: false,
        });

        sendNotificationViaSocket(recipientId, doc);
        sendUnreadCountViaSocket(recipientId, unreadCount);
      })
    );

    return { insertedCount: createdDocs.length };
  }

  /**
   * Fetch paginated notifications for the authenticated user
   */
  public async getUserNotifications(
    userId: string,
    query: GetNotificationsQuery
  ) {
    const filter: Record<string, any> = {
      recipient: new mongoose.Types.ObjectId(userId),
    };

    if (query.isRead !== undefined) {
      filter.isRead = query.isRead;
    }

    if (query.workspaceId) {
      if (mongoose.isValidObjectId(query.workspaceId)) {
        filter.workspace = new mongoose.Types.ObjectId(query.workspaceId);
      }
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "_id name email profilePicture")
        .populate("workspace", "_id name"),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({
        recipient: new mongoose.Types.ObjectId(userId),
        isRead: false,
      }),
    ]);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        unreadCount,
      },
    };
  }

  /**
   * Get unread notification count for user
   */
  public async getUnreadCount(userId: string, workspaceId?: string) {
    const filter: Record<string, any> = {
      recipient: new mongoose.Types.ObjectId(userId),
      isRead: false,
    };

    if (workspaceId && mongoose.isValidObjectId(workspaceId)) {
      filter.workspace = new mongoose.Types.ObjectId(workspaceId);
    }

    const unreadCount = await NotificationModel.countDocuments(filter);
    return { unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  public async markAsRead(notificationId: string, userId: string) {
    if (!mongoose.isValidObjectId(notificationId)) {
      throw new BadRequestException("Invalid notification ID");
    }

    const notification = await NotificationModel.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    const unreadCount = await NotificationModel.countDocuments({
      recipient: userId,
      isRead: false,
    });

    // Notify client through socket
    sendNotificationReadViaSocket(userId, notificationId, unreadCount);
    sendUnreadCountViaSocket(userId, unreadCount);

    return {
      success: true,
      notification,
      unreadCount,
    };
  }

  /**
   * Mark all notifications as read for a user
   */
  public async markAllAsRead(userId: string, workspaceId?: string) {
    const filter: Record<string, any> = {
      recipient: new mongoose.Types.ObjectId(userId),
      isRead: false,
    };

    if (workspaceId && mongoose.isValidObjectId(workspaceId)) {
      filter.workspace = new mongoose.Types.ObjectId(workspaceId);
    }

    const result = await NotificationModel.updateMany(filter, {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Emit socket event
    sendAllNotificationsReadViaSocket(userId);
    sendUnreadCountViaSocket(userId, 0);

    return {
      success: true,
      modifiedCount: result.modifiedCount,
      unreadCount: 0,
    };
  }

  /**
   * Delete a notification
   */
  public async deleteNotification(notificationId: string, userId: string) {
    if (!mongoose.isValidObjectId(notificationId)) {
      throw new BadRequestException("Invalid notification ID");
    }

    const notification = await NotificationModel.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    const unreadCount = await NotificationModel.countDocuments({
      recipient: userId,
      isRead: false,
    });

    sendNotificationDeletedViaSocket(userId, notificationId, unreadCount);
    sendUnreadCountViaSocket(userId, unreadCount);

    return {
      success: true,
      message: "Notification deleted successfully",
      unreadCount,
    };
  }

  /**
   * Clear all notifications for user
   */
  public async clearAllNotifications(userId: string, workspaceId?: string) {
    const filter: Record<string, any> = {
      recipient: new mongoose.Types.ObjectId(userId),
    };

    if (workspaceId && mongoose.isValidObjectId(workspaceId)) {
      filter.workspace = new mongoose.Types.ObjectId(workspaceId);
    }

    const result = await NotificationModel.deleteMany(filter);

    sendAllNotificationsReadViaSocket(userId);
    sendUnreadCountViaSocket(userId, 0);

    return {
      success: true,
      deletedCount: result.deletedCount,
      unreadCount: 0,
    };
  }
}

export const notificationService = new NotificationService();

