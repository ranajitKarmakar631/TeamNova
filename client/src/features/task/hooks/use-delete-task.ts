import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { deleteTaskApi } from "../api/task.api";
import { taskKeys } from "../task.keys";
import { workspaceKeys } from "@/features/workspace";
import { CustomError } from "@/lib/api-error";

export const useDeleteTaskMutation = (
  options?: UseMutationOptions<
    { message: string },
    CustomError,
    { workspaceId: string; taskId: string }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTaskApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.allTasksInWorkspace(variables.workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.analytics(variables.workspaceId),
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

