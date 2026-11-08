import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { createTaskApi } from "../api/task.api";
import { CreateTaskPayloadType } from "../types/task.types";
import { taskKeys } from "../task.keys";
import { workspaceKeys } from "@/features/workspace";
import { projectKeys } from "@/features/project";
import { CustomError } from "@/lib/api-error";

export const useCreateTaskMutation = (
  options?: UseMutationOptions<any, CustomError, CreateTaskPayloadType>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTaskApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.allTasksInWorkspace(variables.workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.analytics(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.overview(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.analytics(variables.workspaceId),
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

