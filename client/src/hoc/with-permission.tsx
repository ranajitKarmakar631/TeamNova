/* eslint-disable @typescript-eslint/no-explicit-any */
import { PermissionType } from "@/constant";
import { useAuthContext } from "@/context/auth-provider";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withPermission = (
  WrappedComponent: React.ComponentType,
  requiredPermission: PermissionType
) => {
  const WithPermission = (props: any) => {
    const { user, hasPermission, isLoading, workspaceLoading } =
      useAuthContext();
    const navigate = useNavigate();
    const workspaceId = useWorkspaceId();

    const isPending = isLoading || workspaceLoading;

    useEffect(() => {
      if (isPending) return;
      if (!user || !hasPermission(requiredPermission)) {
        if (workspaceId) {
          navigate(`/workspace/${workspaceId}`, { replace: true });
        }
      }
    }, [isPending, user, hasPermission, navigate, workspaceId]);

    if (isPending) {
      return <div>Loading...</div>;
    }

    // Check if user has the required permission
    if (!user || !hasPermission(requiredPermission)) {
      return null;
    }
    // If the user has permission, render the wrapped component
    return <WrappedComponent {...props} />;
  };
  return WithPermission;
};

export default withPermission;
