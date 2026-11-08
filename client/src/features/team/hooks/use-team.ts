import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getTeamByIdApi } from "../api/team.api";
import { TeamResponseType } from "../types/team.types";
import { teamKeys } from "../team.keys";
import { CustomError } from "@/lib/api-error";

export const useTeamQuery = (
  {
    workspaceId,
    teamId,
  }: {
    workspaceId: string;
    teamId: string;
  },
  options?: Omit<
    UseQueryOptions<TeamResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<TeamResponseType, CustomError>({
    queryKey: teamKeys.detail(teamId),
    queryFn: () => getTeamByIdApi({ workspaceId, teamId }),
    enabled: !!workspaceId && !!teamId,
    staleTime: 30 * 1000,
    ...options,
  });
};

export const useGetTeamByIdQuery = useTeamQuery;
export default useTeamQuery;

