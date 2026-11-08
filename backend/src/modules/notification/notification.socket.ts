import { Socket } from "socket.io";
import { getIO } from "../chats/socket/socket.instance";

export interface AuthenticatedNotificationSocket extends Socket {
  data: {
    userId: string;
    [key: string]: any;
  };
}

export const sendNotificationViaSocket = (
  userId: string,
  notification: any
): boolean => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit("notification:new", notification);
    return true;
  } catch (error) {
    console.warn(
      `[Socket] Could not emit notification to user ${userId}:`,
      (error as Error).message
    );
    return false;
  }
};

export const sendUnreadCountViaSocket = (
  userId: string,
  unreadCount: number
): boolean => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit("notification:unread_count", { unreadCount });
    return true;
  } catch (error) {
    console.warn(
      `[Socket] Could not emit unread count to user ${userId}:`,
      (error as Error).message
    );
    return false;
  }
};

export const sendNotificationReadViaSocket = (
  userId: string,
  notificationId: string,
  unreadCount: number
): boolean => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit("notification:read", {
      notificationId,
      unreadCount,
    });
    return true;
  } catch (error) {
    console.warn(
      `[Socket] Could not emit read status to user ${userId}:`,
      (error as Error).message
    );
    return false;
  }
};

export const sendAllNotificationsReadViaSocket = (userId: string): boolean => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit("notification:all_read", { unreadCount: 0 });
    return true;
  } catch (error) {
    console.warn(
      `[Socket] Could not emit all read status to user ${userId}:`,
      (error as Error).message
    );
    return false;
  }
};

export const sendNotificationDeletedViaSocket = (
  userId: string,
  notificationId: string,
  unreadCount: number
): boolean => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit("notification:deleted", {
      notificationId,
      unreadCount,
    });
    return true;
  } catch (error) {
    console.warn(
      `[Socket] Could not emit delete status to user ${userId}:`,
      (error as Error).message
    );
    return false;
  }
};

export const registerNotificationSocketEvents = (
  socket: AuthenticatedNotificationSocket
): void => {
  const userId = socket.data?.userId;
  if (!userId) return;

  socket.on("notification:get_unread", async () => {
    try {
      const NotificationModel = (await import("./notification.model")).default;
      const count = await NotificationModel.countDocuments({
        recipient: userId,
        isRead: false,
      });
      socket.emit("notification:unread_count", { unreadCount: count });
    } catch (err) {
      console.error("[Socket] Failed to get unread notifications count:", err);
    }
  });

  socket.on(
    "notification:mark_read",
    async (payload: { notificationId: string }) => {
      try {
        if (!payload?.notificationId) return;
        const { notificationService } = await import("./notification.service");
        await notificationService.markAsRead(payload.notificationId, userId);
      } catch (err) {
        console.error(
          "[Socket] Failed to mark notification as read via socket:",
          err
        );
      }
    }
  );

  socket.on(
    "notification:mark_all_read",
    async (payload?: { workspaceId?: string }) => {
      try {
        const { notificationService } = await import("./notification.service");
        await notificationService.markAllAsRead(userId, payload?.workspaceId);
      } catch (err) {
        console.error(
          "[Socket] Failed to mark all notifications as read via socket:",
          err
        );
      }
    }
  );
};
