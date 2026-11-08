import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { assignTeamsToProjectApi } from "../api/project.api";
import {
  AssignTeamsToProjectPayloadType,
  ProjectResponseType,
} from "../types/project.types";
import { projectKeys } from "../project.keys";
import { CustomError } from "@/lib/api-error";

export const useAssignTeamsToProjectMutation = (
  options?: UseMutationOptions<
    ProjectResponseType,
    CustomError,
    AssignTeamsToProjectPayloadType
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignTeamsToProjectApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.teams(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.members(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.overview(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.allProjectsInWorkspace(variables.workspaceId),
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

