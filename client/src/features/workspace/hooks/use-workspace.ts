import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getWorkspaceByIdApi } from "../api/workspace.api";
import { WorkspaceByIdResponseType } from "../types/workspace.types";
import { workspaceKeys } from "../workspace.keys";
import { CustomError } from "@/lib/api-error";

export const useWorkspaceQuery = (
  workspaceId: string,
  options?: Omit<
    UseQueryOptions<WorkspaceByIdResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<WorkspaceByIdResponseType, CustomError>({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: () => getWorkspaceByIdApi(workspaceId),
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
    enabled: !!workspaceId,
    ...options,
  });
};

export const useGetWorkspaceQuery = useWorkspaceQuery;
export default useWorkspaceQuery;

