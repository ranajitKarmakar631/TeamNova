import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { createWorkspaceApi } from "../api/workspace.api";
import {
  CreateWorkspaceResponseType,
  CreateWorkspaceType,
} from "../types/workspace.types";
import { workspaceKeys } from "../workspace.keys";
import { authKeys } from "@/features/auth";
import { CustomError } from "@/lib/api-error";

export const useCreateWorkspaceMutation = (
  options?: UseMutationOptions<
    CreateWorkspaceResponseType,
    CustomError,
    CreateWorkspaceType
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkspaceApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.resetQueries({
        queryKey: workspaceKeys.userWorkspaces,
      });
      queryClient.invalidateQueries({
        queryKey: authKeys.authUser,
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

