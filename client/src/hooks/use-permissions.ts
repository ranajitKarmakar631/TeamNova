import {
  PermissionType,
  WorkspaceRolePermissions,
  WorkspaceRoleType,
} from "@/constant";
import { UserType } from "@/features/auth";
import { WorkspaceWithMembersType } from "@/features/workspace";
import { useMemo } from "react";

const usePermissions = (
  user: UserType | undefined,
  workspace: WorkspaceWithMembersType | undefined
): readonly PermissionType[] => {
  return useMemo(() => {
    if (!user || !workspace) return [];

    const member = workspace.members?.find((m) => {
      const memberUid =
        typeof m.userId === "object" && m.userId !== null
          ? (m.userId as any)._id
          : m.userId;
      return String(memberUid) === String(user._id);
    });

    if (member) {
      const rolePermissions =
        member.role?.permissions && member.role.permissions.length > 0
          ? member.role.permissions
          : WorkspaceRolePermissions[member.role?.name as WorkspaceRoleType] || [];
      return rolePermissions;
    }

    return [];
  }, [user, workspace]);
};

export default usePermissions;

