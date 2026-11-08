import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { deleteProjectApi } from "../api/project.api";
import { ProjectByIdPayloadType } from "../types/project.types";
import { projectKeys } from "../project.keys";
import { workspaceKeys } from "@/features/workspace";
import { CustomError } from "@/lib/api-error";

export const useDeleteProjectMutation = (
  options?: UseMutationOptions<
    { message: string },
    CustomError,
    ProjectByIdPayloadType
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProjectApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.allProjectsInWorkspace(variables.workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.analytics(variables.workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: ["all-tasks", variables.workspaceId],
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

