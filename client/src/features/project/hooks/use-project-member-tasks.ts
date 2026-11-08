import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getProjectMemberTasksApi } from "../api/project.api";
import { ProjectMemberTasksResponseType } from "../types/project.types";
import { projectKeys } from "../project.keys";
import { CustomError } from "@/lib/api-error";

export const useProjectMemberTasksQuery = (
  {
    workspaceId,
    projectId,
    userId,
  }: {
    workspaceId: string;
    projectId: string;
    userId: string;
  },
  options?: Omit<
    UseQueryOptions<ProjectMemberTasksResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ProjectMemberTasksResponseType, CustomError>({
    queryKey: projectKeys.memberTasks(projectId, userId),
    queryFn: () => getProjectMemberTasksApi({ workspaceId, projectId, userId }),
    enabled: !!workspaceId && !!projectId && !!userId,
    staleTime: 30 * 1000,
    ...options,
  });
};

