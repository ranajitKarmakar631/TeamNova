import { useQuery } from "@tanstack/react-query";
import useWorkspaceId from "../use-workspace-id";
import { getScopeMembersQueryFn } from "@/lib/api";
import { AssociationRoleType, AssociationScopeType } from "@/types/api.type";

export const useGetScopeMembers = ({
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
    queryKey: ["scope-members", scopeType, scopeId, workspaceId, status, role, search],
    queryFn: () =>
      getScopeMembersQueryFn({
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

export default useGetScopeMembers;

