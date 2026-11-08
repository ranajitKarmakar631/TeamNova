import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { deleteTeamApi } from "../api/team.api";
import { teamKeys } from "../team.keys";
import { CustomError } from "@/lib/api-error";

export const useDeleteTeamMutation = (
  options?: UseMutationOptions<
    { message: string },
    CustomError,
    { workspaceId: string; teamId: string }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTeamApi,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.allTeamsInWorkspace(variables.workspaceId),
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

