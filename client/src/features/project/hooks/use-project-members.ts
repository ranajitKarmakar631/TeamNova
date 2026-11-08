import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getProjectMembersApi } from "../api/project.api";
import {
  GetProjectMembersPayloadType,
  ProjectMembersResponseType,
} from "../types/project.types";
import { projectKeys } from "../project.keys";
import { CustomError } from "@/lib/api-error";

export const useProjectMembersQuery = (
  {
    workspaceId,
    projectId,
    search,
    teamId,
    role,
    sortBy,
  }: GetProjectMembersPayloadType,
  options?: Omit<
    UseQueryOptions<ProjectMembersResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ProjectMembersResponseType, CustomError>({
    queryKey: projectKeys.members(
      projectId,
      workspaceId,
      search,
      teamId,
      role,
      sortBy
    ),
    queryFn: () =>
      getProjectMembersApi({
        workspaceId,
        projectId,
        search,
        teamId,
        role,
        sortBy,
      }),
    enabled: !!workspaceId && !!projectId,
    staleTime: 30 * 1000,
    ...options,
  });
};

