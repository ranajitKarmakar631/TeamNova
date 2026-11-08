import { Router } from "express";
import {
  clearAllNotificationsController,
  deleteNotificationController,
  getUnreadCountController,
  getUserNotificationsController,
  markAllAsReadController,
  markAsReadController,
  sendBulkNotificationController,
  sendNotificationController,
} from "./notification.controller";

const notificationRoutes = Router();

// Queries
notificationRoutes.get("/", getUserNotificationsController);
notificationRoutes.get("/all", getUserNotificationsController);
notificationRoutes.get("/unread-count", getUnreadCountController);

// Mutation operations
notificationRoutes.patch("/read-all", markAllAsReadController);
notificationRoutes.put("/read-all", markAllAsReadController);
notificationRoutes.post("/read-all", markAllAsReadController);

notificationRoutes.patch("/:id/read", markAsReadController);
notificationRoutes.put("/:id/read", markAsReadController);
notificationRoutes.post("/:id/read", markAsReadController);

notificationRoutes.delete("/:id", deleteNotificationController);
notificationRoutes.delete("/", clearAllNotificationsController);

// Queue / Trigger notifications
notificationRoutes.post("/send", sendNotificationController);
notificationRoutes.post("/send/bulk", sendBulkNotificationController);

export default notificationRoutes;

