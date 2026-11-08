import { keepPreviousData, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getAllTeamsApi } from "../api/team.api";
import { AllTeamsPayloadType, AllTeamsResponseType } from "../types/team.types";
import { teamKeys } from "../team.keys";
import { CustomError } from "@/lib/api-error";

export const useTeamsQuery = (
  {
    workspaceId,
    keyword,
    status,
    projectId,
    pageNumber = 1,
    pageSize = 10,
    onlyMyTeams,
  }: AllTeamsPayloadType,
  options?: Omit<
    UseQueryOptions<AllTeamsResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<AllTeamsResponseType, CustomError>({
    queryKey: teamKeys.list(
      workspaceId,
      keyword,
      status,
      projectId,
      pageNumber,
      pageSize
    ),
    queryFn: () =>
      getAllTeamsApi({
        workspaceId,
        keyword,
        status,
        projectId,
        pageNumber,
        pageSize,
        onlyMyTeams,
      }),
    staleTime: 10 * 1000,
    placeholderData: keepPreviousData,
    enabled: !!workspaceId,
    ...options,
  });
};

export const useGetAllTeamsQuery = useTeamsQuery;
export default useTeamsQuery;

