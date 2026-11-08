import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { editTaskApi } from "../api/task.api";
import { EditTaskPayloadType } from "../types/task.types";
import { taskKeys } from "../task.keys";
import { workspaceKeys } from "@/features/workspace";
import { projectKeys } from "@/features/project";
import { CustomError } from "@/lib/api-error";

export const useUpdateTaskMutation = (
  options?: UseMutationOptions<
    { message: string },
    CustomError,
    EditTaskPayloadType
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editTaskApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.allTasksInWorkspace(variables.workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(variables.taskId),
      });
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: projectKeys.analytics(variables.projectId),
        });
        queryClient.invalidateQueries({
          queryKey: projectKeys.overview(variables.projectId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.analytics(variables.workspaceId),
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

export const useEditTaskMutation = useUpdateTaskMutation;

