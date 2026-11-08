import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { editTeamApi } from "../api/team.api";
import { EditTeamPayloadType, TeamResponseType } from "../types/team.types";
import { teamKeys } from "../team.keys";
import { CustomError } from "@/lib/api-error";

export const useUpdateTeamMutation = (
  options?: UseMutationOptions<
    TeamResponseType,
    CustomError,
    EditTeamPayloadType
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editTeamApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.allTeamsInWorkspace(variables.workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: teamKeys.detail(variables.teamId),
      });
      queryClient.invalidateQueries({
        queryKey: ["project-teams"],
      });
      queryClient.invalidateQueries({
        queryKey: ["allprojects", variables.workspaceId],
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

export const useEditTeamMutation = useUpdateTeamMutation;

