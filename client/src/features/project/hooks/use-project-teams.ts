import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getProjectTeamsApi } from "../api/project.api";
import {
  GetProjectTeamsPayloadType,
  ProjectTeamsResponseType,
} from "../types/project.types";
import { projectKeys } from "../project.keys";
import { CustomError } from "@/lib/api-error";

export const useProjectTeamsQuery = (
  { workspaceId, projectId, search, status }: GetProjectTeamsPayloadType,
  options?: Omit<
    UseQueryOptions<ProjectTeamsResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ProjectTeamsResponseType, CustomError>({
    queryKey: projectKeys.teams(projectId, workspaceId, search, status),
    queryFn: () =>
      getProjectTeamsApi({ workspaceId, projectId, search, status }),
    enabled: !!workspaceId && !!projectId,
    staleTime: 30 * 1000,
    ...options,
  });
};

