import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { changeWorkspaceMemberRoleApi } from "../api/member.api";
import { ChangeWorkspaceMemberRoleType } from "../types/member.types";
import { memberKeys } from "../member.keys";
import { CustomError } from "@/lib/api-error";

export const useChangeMemberRoleMutation = (
  options?: UseMutationOptions<any, CustomError, ChangeWorkspaceMemberRoleType>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeWorkspaceMemberRoleApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: memberKeys.workspaceMembers(variables.workspaceId),
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

