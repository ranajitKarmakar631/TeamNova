import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  acceptInviteApi,
  getInviteDetailsApi,
  invitedUserJoinWorkspaceApi,
} from "../api/workspace.api";
import {
  AcceptInviteResponseType,
  JoinWorkspaceResponseType,
} from "../types/workspace.types";
import { workspaceKeys } from "../workspace.keys";
import { authKeys } from "@/features/auth";
import { CustomError } from "@/lib/api-error";

export const useInviteDetailsQuery = (
  tokenOrCode: string,
  options?: Omit<UseQueryOptions<any, CustomError>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: workspaceKeys.inviteDetails(tokenOrCode),
    queryFn: () => getInviteDetailsApi(tokenOrCode),
    enabled: !!tokenOrCode,
    retry: false,
    ...options,
  });
};

export const useAcceptInviteMutation = (
  options?: UseMutationOptions<AcceptInviteResponseType, CustomError, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptInviteApi,
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

export const useJoinWorkspaceMutation = (
  options?: UseMutationOptions<JoinWorkspaceResponseType, CustomError, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invitedUserJoinWorkspaceApi,
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

