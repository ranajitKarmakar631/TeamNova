import React from "react";
import { PermissionType } from "@/constant";
import { useAuthContext } from "@/context/auth-provider";

type PermissionsGuardProps = {
  requiredPermission: PermissionType;
  children: React.ReactNode;
  showMessage?: boolean;
};

const PermissionsGuard: React.FC<PermissionsGuardProps> = ({
  requiredPermission,
  showMessage = false,
  children,
}) => {
  const { hasPermission, isLoading, workspaceLoading } = useAuthContext();

  // Prevent flashing unauthorized message while auth or workspace is still loading
  if (isLoading || workspaceLoading) {
    return null;
  }

  if (!hasPermission(requiredPermission)) {
    return (
      showMessage && (
        <div
          className="text-center 
        text-sm pt-3
        italic
        w-full
        text-muted-foreground"
        >
          You do not have the permission to view this
        </div>
      )
    );
  }

  return <>{children}</>;
};

export default PermissionsGuard;
