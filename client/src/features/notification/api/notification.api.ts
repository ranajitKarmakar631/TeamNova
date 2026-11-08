import API from "@/lib/axios-client";
import {
  NotificationItemType,
  NotificationsResponseType,
  UnreadCountResponseType,
} from "../types/notification.types";

export const getNotificationsApi = async (params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
  workspaceId?: string;
}): Promise<NotificationsResponseType> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.limit) queryParams.append("limit", String(params.limit));
  if (params?.isRead !== undefined)
    queryParams.append("isRead", String(params.isRead));
  if (params?.workspaceId) queryParams.append("workspaceId", params.workspaceId);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const response = await API.get(`/notifications${queryString}`);
  return response.data;
};

export const getUnreadNotificationCountApi = async (
  workspaceId?: string
): Promise<UnreadCountResponseType> => {
  const params = workspaceId ? `?workspaceId=${workspaceId}` : "";
  const response = await API.get(`/notifications/unread-count${params}`);
  return response.data;
};

export const markNotificationAsReadApi = async (
  notificationId: string
): Promise<{
  message: string;
  notification: NotificationItemType;
  unreadCount: number;
}> => {
  const response = await API.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsReadApi = async (payload?: {
  workspaceId?: string;
}): Promise<{ message: string; unreadCount: number }> => {
  const response = await API.patch("/notifications/read-all", payload || {});
  return response.data;
};

export const deleteNotificationApi = async (
  notificationId: string
): Promise<{ message: string; unreadCount: number }> => {
  const response = await API.delete(`/notifications/${notificationId}`);
  return response.data;
};

export const clearAllNotificationsApi = async (payload?: {
  workspaceId?: string;
}): Promise<{ message: string; unreadCount: number }> => {
  const response = await API.delete("/notifications", { data: payload });
  return response.data;
};

