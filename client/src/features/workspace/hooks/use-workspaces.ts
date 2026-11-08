import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getAllWorkspacesUserIsMemberApi } from "../api/workspace.api";
import { AllWorkspaceResponseType } from "../types/workspace.types";
import { workspaceKeys } from "../workspace.keys";
import { CustomError } from "@/lib/api-error";

export const useAllWorkspacesQuery = (
  options?: Omit<
    UseQueryOptions<AllWorkspaceResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<AllWorkspaceResponseType, CustomError>({
    queryKey: workspaceKeys.userWorkspaces,
    queryFn: getAllWorkspacesUserIsMemberApi,
    staleTime: 10 * 1000,
    ...options,
  });
};

