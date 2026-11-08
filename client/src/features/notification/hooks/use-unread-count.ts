import { useQuery } from "@tanstack/react-query";
import { getUnreadNotificationCountApi } from "../api/notification.api";
import { UnreadCountResponseType } from "../types/notification.types";
import { notificationKeys } from "../notification.keys";
import { CustomError } from "@/lib/api-error";

export const useUnreadNotificationCountQuery = (workspaceId?: string) => {
  return useQuery<UnreadCountResponseType, CustomError>({
    queryKey: notificationKeys.unreadCount(workspaceId),
    queryFn: () => getUnreadNotificationCountApi(workspaceId),
    staleTime: 1000 * 30,
    retry: 1,
  });
};

export const useGetUnreadNotificationCountQuery =
  useUnreadNotificationCountQuery;
export default useUnreadNotificationCountQuery;

