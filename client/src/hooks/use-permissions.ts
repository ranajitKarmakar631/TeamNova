import {
  PermissionType,
  WorkspaceRolePermissions,
  WorkspaceRoleType,
} from "@/constant";
import { UserType, WorkspaceWithMembersType } from "@/types/api.type";
import { useEffect, useMemo, useState } from "react";

const usePermissions = (
  user: UserType | undefined,
  workspace: WorkspaceWithMembersType | undefined
) => {
  const [permissions, setPermissions] = useState<readonly PermissionType[]>([]);

  useEffect(() => {
    if (user && workspace) {
      const member = workspace.members?.find(
        (member) => member.userId === user._id
      );
      if (member) {
        const rolePermissions =
          member.role?.permissions && member.role.permissions.length > 0
            ? member.role.permissions
            : WorkspaceRolePermissions[member.role?.name as WorkspaceRoleType] || [];
        setPermissions(rolePermissions);
      }
    }
  }, [user, workspace]);

  return useMemo(() => permissions, [permissions]);
};

export default usePermissions;

