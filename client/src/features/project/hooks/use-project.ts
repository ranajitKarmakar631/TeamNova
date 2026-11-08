import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getProjectByIdApi } from "../api/project.api";
import { ProjectByIdPayloadType, ProjectResponseType } from "../types/project.types";
import { projectKeys } from "../project.keys";
import { CustomError } from "@/lib/api-error";

export const useProjectQuery = (
  { workspaceId, projectId }: ProjectByIdPayloadType,
  options?: Omit<
    UseQueryOptions<ProjectResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ProjectResponseType, CustomError>({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => getProjectByIdApi({ workspaceId, projectId }),
    enabled: !!workspaceId && !!projectId,
    staleTime: 30 * 1000,
    ...options,
  });
};

