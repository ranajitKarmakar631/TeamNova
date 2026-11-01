import { useQuery } from "@tanstack/react-query";
import useWorkspaceId from "../use-workspace-id";
import { getAvailableScopeMembersQueryFn } from "@/lib/api";
import { AssociationScopeType } from "@/types/api.type";

interface UseGetAvailableScopeMembersParams {
  workspaceId?: string;
  scopeType: AssociationScopeType;
  scopeId?: string;
  search?: string;
  enabled?: boolean;
}

export const useGetAvailableScopeMembers = ({
  workspaceId: workspaceIdParam,
  scopeType,
  scopeId,
  search,
  enabled = true,
}: UseGetAvailableScopeMembersParams) => {
  const defaultWorkspaceId = useWorkspaceId();
  const workspaceId = workspaceIdParam || defaultWorkspaceId;

  return useQuery({
    queryKey: [
      "available-scope-members",
      scopeType,
      scopeId,
      workspaceId,
      search,
    ],
    queryFn: () =>
      getAvailableScopeMembersQueryFn({
        workspaceId,
        scopeType,
        scopeId: scopeId!,
        search,
      }),
    enabled: Boolean(workspaceId && scopeId && enabled),
    staleTime: 30 * 1000,
  });
};

export default useGetAvailableScopeMembers;

