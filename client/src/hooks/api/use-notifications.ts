import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearAllNotificationsMutationFn,
  deleteNotificationMutationFn,
  getNotificationsQueryFn,
  getUnreadNotificationCountQueryFn,
  markAllNotificationsAsReadMutationFn,
  markNotificationAsReadMutationFn,
} from "@/lib/api";
import {
  NotificationsResponseType,
  UnreadCountResponseType,
} from "@/types/notification.type";
import { CustomError } from "@/types/custom-error.type";

export const NOTIFICATION_QUERY_KEYS = {
  all: ["notifications"] as const,
  list: (params?: Record<string, any>) => ["notifications", "list", params] as const,
  unreadCount: (workspaceId?: string) =>
    ["notifications", "unread-count", workspaceId || "all"] as const,
};

export const useGetNotificationsQuery = (params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
  workspaceId?: string;
}) => {
  return useQuery<NotificationsResponseType, CustomError>({
    queryKey: NOTIFICATION_QUERY_KEYS.list(params),
    queryFn: () => getNotificationsQueryFn(params),
    staleTime: 1000 * 30, // 30 seconds
    retry: 1,
  });
};

export const useGetUnreadNotificationCountQuery = (workspaceId?: string) => {
  return useQuery<UnreadCountResponseType, CustomError>({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(workspaceId),
    queryFn: () => getUnreadNotificationCountQueryFn(workspaceId),
    staleTime: 1000 * 30,
    retry: 1,
  });
};

export const useMarkNotificationAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationAsReadMutationFn(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
};

export const useMarkAllNotificationsAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: { workspaceId?: string }) =>
      markAllNotificationsAsReadMutationFn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
};

export const useDeleteNotificationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      deleteNotificationMutationFn(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
};

export const useClearAllNotificationsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: { workspaceId?: string }) =>
      clearAllNotificationsMutationFn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
};

