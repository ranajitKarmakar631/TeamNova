import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { createTeamApi } from "../api/team.api";
import { CreateTeamPayloadType, TeamResponseType } from "../types/team.types";
import { teamKeys } from "../team.keys";
import { CustomError } from "@/lib/api-error";

export const useCreateTeamMutation = (
  options?: UseMutationOptions<
    TeamResponseType,
    CustomError,
    CreateTeamPayloadType
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeamApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.allTeamsInWorkspace(variables.workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: ["allprojects", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-teams"],
      });
      options?.onSuccess?.(data, variables, context);
    },
  });
};

