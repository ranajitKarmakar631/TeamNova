import { useQuery } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getAvailableScopeMembersApi } from "../api/association.api";
import { AssociationScopeType } from "../types/association.types";
import { associationKeys } from "../association.keys";

interface UseGetAvailableScopeMembersParams {
  workspaceId?: string;
  scopeType: AssociationScopeType;
  scopeId?: string;
  search?: string;
  enabled?: boolean;
}

export const useAvailableScopeMembersQuery = ({
  workspaceId: workspaceIdParam,
  scopeType,
  scopeId,
  search,
  enabled = true,
}: UseGetAvailableScopeMembersParams) => {
  const defaultWorkspaceId = useWorkspaceId();
  const workspaceId = workspaceIdParam || defaultWorkspaceId;

  return useQuery({
    queryKey: associationKeys.availableScopeMembers(
      scopeType,
      scopeId,
      workspaceId,
      search
    ),
    queryFn: () =>
      getAvailableScopeMembersApi({
        workspaceId,
        scopeType,
        scopeId: scopeId!,
        search,
      }),
    enabled: Boolean(workspaceId && scopeId && enabled),
    staleTime: 30 * 1000,
  });
};

export const useGetAvailableScopeMembers = useAvailableScopeMembersQuery;
export default useAvailableScopeMembersQuery;
