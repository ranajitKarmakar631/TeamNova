import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { editProjectApi } from "../api/project.api";
import { EditProjectPayloadType, ProjectResponseType } from "../types/project.types";
import { projectKeys } from "../project.keys";
import { CustomError } from "@/lib/api-error";

export const useUpdateProjectMutation = (
  options?: UseMutationOptions<
    ProjectResponseType,
    CustomError,
    EditProjectPayloadType
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editProjectApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.allProjectsInWorkspace(variables.workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.overview(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.teams(variables.projectId),
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

export const useEditProjectMutation = useUpdateProjectMutation;

