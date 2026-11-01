import {
  AllRoleType,
  AssociationRolePermissions,
  PermissionType,
  WorkspaceRolePermissions,
} from "../enums/association.enum";

export const RolePermissions: Record<AllRoleType, readonly PermissionType[]> = {
  ...WorkspaceRolePermissions,
  ...AssociationRolePermissions,
};

