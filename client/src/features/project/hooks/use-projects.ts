import { keepPreviousData, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getProjectsInWorkspaceApi } from "../api/project.api";
import { AllProjectPayloadType, AllProjectResponseType } from "../types/project.types";
import { projectKeys } from "../project.keys";
import { CustomError } from "@/lib/api-error";

export const useProjectsQuery = (
  {
    workspaceId,
    pageSize = 10,
    pageNumber = 1,
    keyword,
    skip = false,
    onlyMyProjects,
  }: AllProjectPayloadType,
  options?: Omit<
    UseQueryOptions<AllProjectResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<AllProjectResponseType, CustomError>({
    queryKey: projectKeys.list(
      workspaceId,
      pageNumber,
      pageSize,
      keyword,
      onlyMyProjects
    ),
    queryFn: () =>
      getProjectsInWorkspaceApi({
        workspaceId,
        pageSize,
        pageNumber,
        keyword,
        onlyMyProjects,
      }),
    staleTime: 10 * 1000,
    placeholderData: skip ? undefined : keepPreviousData,
    enabled: !skip && !!workspaceId,
    ...options,
  });
};

export const useGetProjectsInWorkspaceQuery = useProjectsQuery;
export default useProjectsQuery;

