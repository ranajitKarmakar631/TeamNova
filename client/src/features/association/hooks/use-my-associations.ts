import { useQuery } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getMyAssociationsApi } from "../api/association.api";
import { associationKeys } from "../association.keys";

export const useMyAssociationsQuery = (workspaceIdParam?: string) => {
  const defaultWorkspaceId = useWorkspaceId();
  const workspaceId = workspaceIdParam || defaultWorkspaceId;

  return useQuery({
    queryKey: associationKeys.myAssociations(workspaceId),
    queryFn: () => getMyAssociationsApi(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
  });
};

export const useGetMyAssociations = useMyAssociationsQuery;
export default useMyAssociationsQuery;

