import { useQuery } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getScopeMembersApi } from "../api/association.api";
import { AssociationRoleType } from "@/constant";
import { AssociationScopeType } from "../types/association.types";
import { associationKeys } from "../association.keys";

export const useScopeMembersQuery = ({
  workspaceId: workspaceIdParam,
  scopeType,
  scopeId,
  status,
  role,
  search,
}: {
  workspaceId?: string;
  scopeType: AssociationScopeType;
  scopeId?: string;
  status?: string;
  role?: AssociationRoleType;
  search?: string;
}) => {
  const defaultWorkspaceId = useWorkspaceId();
  const workspaceId = workspaceIdParam || defaultWorkspaceId;

  return useQuery({
    queryKey: associationKeys.scopeMembers(
      scopeType,
      scopeId,
      workspaceId,
      status,
      role,
      search
    ),
    queryFn: () =>
      getScopeMembersApi({
        workspaceId,
        scopeType,
        scopeId: scopeId!,
        status,
        role,
        search,
      }),
    enabled: Boolean(workspaceId && scopeId),
    staleTime: 30 * 1000,
  });
};

export const useGetScopeMembers = useScopeMembersQuery;
export default useScopeMembersQuery;
