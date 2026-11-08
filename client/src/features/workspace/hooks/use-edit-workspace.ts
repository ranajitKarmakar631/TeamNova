import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { editWorkspaceApi } from "../api/workspace.api";
import { EditWorkspaceType } from "../types/workspace.types";
import { workspaceKeys } from "../workspace.keys";
import { CustomError } from "@/lib/api-error";

export const useEditWorkspaceMutation = (
  options?: UseMutationOptions<
    { message: string; workspace: any },
    CustomError,
    EditWorkspaceType
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editWorkspaceApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.userWorkspaces,
      });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(variables.workspaceId),
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

