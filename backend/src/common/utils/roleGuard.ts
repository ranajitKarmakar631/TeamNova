import { AllRoleType, PermissionType } from "../enums/association.enum";
import { UnauthorizedException } from "./appError";
import { RolePermissions } from "./role-permission";

export const roleGuard = (
  role: AllRoleType | string,
  requiredPermissions: PermissionType[]
) => {
  const permissions = (RolePermissions as any)[role] || [];
  const hasPermission = requiredPermissions.every((permission) =>
    permissions.includes(permission)
  );
  if (!hasPermission) {
    throw new UnauthorizedException(
      "You do not have the necessary permissions to perform this action"
    );
  }
};
