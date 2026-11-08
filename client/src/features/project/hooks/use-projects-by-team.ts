import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getProjectsByTeamApi } from "../api/project.api";
import { AllProjectResponseType } from "../types/project.types";
import { projectKeys } from "../project.keys";
import { CustomError } from "@/lib/api-error";

export const useProjectsByTeamQuery = (
  {
    workspaceId,
    teamId,
    pageSize = 10,
    pageNumber = 1,
  }: {
    workspaceId: string;
    teamId: string;
    pageSize?: number;
    pageNumber?: number;
  },
  options?: Omit<
    UseQueryOptions<AllProjectResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<AllProjectResponseType, CustomError>({
    queryKey: projectKeys.byTeam(workspaceId, teamId),
    queryFn: () =>
      getProjectsByTeamApi({ workspaceId, teamId, pageSize, pageNumber }),
    enabled: !!workspaceId && !!teamId,
    staleTime: 30 * 1000,
    ...options,
  });
};

