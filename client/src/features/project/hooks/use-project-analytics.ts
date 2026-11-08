import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getProjectAnalyticsApi } from "../api/project.api";
import { ProjectByIdPayloadType } from "../types/project.types";
import { projectKeys } from "../project.keys";
import { AnalyticsResponseType } from "@/features/workspace/types/workspace.types";
import { CustomError } from "@/lib/api-error";

export const useProjectAnalyticsQuery = (
  { workspaceId, projectId }: ProjectByIdPayloadType,
  options?: Omit<
    UseQueryOptions<AnalyticsResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<AnalyticsResponseType, CustomError>({
    queryKey: projectKeys.analytics(projectId),
    queryFn: () => getProjectAnalyticsApi({ workspaceId, projectId }),
    enabled: !!workspaceId && !!projectId,
    staleTime: 30 * 1000,
    ...options,
  });
};

