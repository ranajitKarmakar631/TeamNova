import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { createProjectApi } from "../api/project.api";
import { CreateProjectPayloadType, ProjectResponseType } from "../types/project.types";
import { projectKeys } from "../project.keys";
import { workspaceKeys } from "@/features/workspace";
import { CustomError } from "@/lib/api-error";

export const useCreateProjectMutation = (
  options?: UseMutationOptions<
    ProjectResponseType,
    CustomError,
    CreateProjectPayloadType
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProjectApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.allProjectsInWorkspace(variables.workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: ["all-teams", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.analytics(variables.workspaceId),
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

