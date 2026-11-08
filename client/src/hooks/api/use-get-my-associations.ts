import { useQuery } from "@tanstack/react-query";
import useWorkspaceId from "../use-workspace-id";
import { getMyAssociationsQueryFn } from "@/lib/api";

export const useGetMyAssociations = (workspaceIdParam?: string) => {
  const defaultWorkspaceId = useWorkspaceId();
  const workspaceId = workspaceIdParam || defaultWorkspaceId;

  return useQuery({
    queryKey: ["my-associations", workspaceId],
    queryFn: () => getMyAssociationsQueryFn(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
  });
};

export default useGetMyAssociations;
