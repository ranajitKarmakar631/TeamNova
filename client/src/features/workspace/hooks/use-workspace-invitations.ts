import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  createEmailInviteApi,
  createLinkInviteApi,
  getWorkspaceInvitationsApi,
  revokeInvitationApi,
} from "../api/workspace.api";
import {
  CreateEmailInvitePayloadType,
  CreateInviteResponseType,
  CreateLinkInvitePayloadType,
  RevokeInvitationPayloadType,
} from "../types/workspace.types";
import { workspaceKeys } from "../workspace.keys";
import { CustomError } from "@/lib/api-error";

export const useWorkspaceInvitationsQuery = (
  workspaceId: string,
  options?: Omit<UseQueryOptions<any, CustomError>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: workspaceKeys.invitations(workspaceId),
    queryFn: () => getWorkspaceInvitationsApi(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
    ...options,
  });
};

export const useCreateLinkInviteMutation = (
  options?: UseMutationOptions<
    CreateInviteResponseType,
    CustomError,
    CreateLinkInvitePayloadType
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLinkInviteApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.invitations(variables.workspaceId),
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

export const useCreateEmailInviteMutation = (
  options?: UseMutationOptions<
    CreateInviteResponseType,
    CustomError,
    CreateEmailInvitePayloadType
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmailInviteApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.invitations(variables.workspaceId),
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

export const useRevokeInvitationMutation = (
  options?: UseMutationOptions<
    { message: string },
    CustomError,
    RevokeInvitationPayloadType
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeInvitationApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.invitations(variables.workspaceId),
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

