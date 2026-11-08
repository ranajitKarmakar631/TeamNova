import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  clearAllNotificationsApi,
  deleteNotificationApi,
  markAllNotificationsAsReadApi,
  markNotificationAsReadApi,
} from "../api/notification.api";
import { notificationKeys } from "../notification.keys";

export const useMarkNotificationAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationAsReadApi(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useMarkAllNotificationsAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: { workspaceId?: string }) =>
      markAllNotificationsAsReadApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useDeleteNotificationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      deleteNotificationApi(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useClearAllNotificationsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: { workspaceId?: string }) =>
      clearAllNotificationsApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

