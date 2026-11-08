import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getMembersInWorkspaceApi } from "../api/member.api";
import { AllMembersInWorkspaceResponseType } from "../types/member.types";
import { memberKeys } from "../member.keys";
import { CustomError } from "@/lib/api-error";

export const useWorkspaceMembersQuery = (
  workspaceId: string,
  options?: Omit<
    UseQueryOptions<AllMembersInWorkspaceResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<AllMembersInWorkspaceResponseType, CustomError>({
    queryKey: memberKeys.workspaceMembers(workspaceId),
    queryFn: () => getMembersInWorkspaceApi(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
    ...options,
  });
};

export const useGetWorkspaceMembers = useWorkspaceMembersQuery;
export default useWorkspaceMembersQuery;

