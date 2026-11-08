import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { deleteWorkspaceApi } from "../api/workspace.api";
import { DeleteWorkspaceResponseType } from "../types/workspace.types";
import { workspaceKeys } from "../workspace.keys";
import { authKeys } from "@/features/auth";
import { CustomError } from "@/lib/api-error";

export const useDeleteWorkspaceMutation = (
  options?: UseMutationOptions<
    DeleteWorkspaceResponseType,
    CustomError,
    string
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkspaceApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.userWorkspaces,
      });
      queryClient.invalidateQueries({
        queryKey: authKeys.authUser,
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

