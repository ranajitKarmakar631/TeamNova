import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { deleteWorkspaceMemberApi } from "../api/member.api";
import { memberKeys } from "../member.keys";
import { workspaceKeys } from "@/features/workspace";
import { CustomError } from "@/lib/api-error";

export const useDeleteWorkspaceMemberMutation = (
  options?: UseMutationOptions<
    { message: string },
    CustomError,
    { workspaceId: string; memberId: string }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkspaceMemberApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: memberKeys.workspaceMembers(variables.workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.userWorkspaces,
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

