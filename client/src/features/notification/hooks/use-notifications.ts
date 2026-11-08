import { useQuery } from "@tanstack/react-query";
import { getNotificationsApi } from "../api/notification.api";
import { NotificationsResponseType } from "../types/notification.types";
import { notificationKeys } from "../notification.keys";
import { CustomError } from "@/lib/api-error";

export const useNotificationsQuery = (params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
  workspaceId?: string;
}) => {
  return useQuery<NotificationsResponseType, CustomError>({
    queryKey: notificationKeys.list(params),
    queryFn: () => getNotificationsApi(params),
    staleTime: 1000 * 30, // 30 seconds
    retry: 1,
  });
};

export const useGetNotificationsQuery = useNotificationsQuery;
export default useNotificationsQuery;

