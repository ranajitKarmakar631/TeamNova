import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getWorkspaceAnalyticsApi } from "../api/workspace.api";
import { AnalyticsResponseType } from "../types/workspace.types";
import { workspaceKeys } from "../workspace.keys";
import { CustomError } from "@/lib/api-error";

export const useWorkspaceAnalyticsQuery = (
  workspaceId: string,
  options?: Omit<
    UseQueryOptions<AnalyticsResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<AnalyticsResponseType, CustomError>({
    queryKey: workspaceKeys.analytics(workspaceId),
    queryFn: () => getWorkspaceAnalyticsApi(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
    ...options,
  });
};

