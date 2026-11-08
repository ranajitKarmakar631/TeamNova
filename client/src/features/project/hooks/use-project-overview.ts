import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getProjectOverviewApi } from "../api/project.api";
import {
  ProjectByIdPayloadType,
  ProjectOverviewResponseType,
} from "../types/project.types";
import { projectKeys } from "../project.keys";
import { CustomError } from "@/lib/api-error";

export const useProjectOverviewQuery = (
  { workspaceId, projectId }: ProjectByIdPayloadType,
  options?: Omit<
    UseQueryOptions<ProjectOverviewResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ProjectOverviewResponseType, CustomError>({
    queryKey: projectKeys.overview(projectId),
    queryFn: () => getProjectOverviewApi({ workspaceId, projectId }),
    enabled: !!workspaceId && !!projectId,
    staleTime: 30 * 1000,
    ...options,
  });
};

