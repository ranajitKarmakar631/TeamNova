import { Types } from "mongoose";
import { RolePermissionModel, IRolePermissionDocument } from "./rolePermission.model";
import { PermissionType } from "../../common/enums/association.enum";
import { AppError } from "../../common/utils/appError";

export class RolePermissionService {
  async getByRoleId(roleId: string | Types.ObjectId): Promise<IRolePermissionDocument | null> {
    return RolePermissionModel.findOne({ roleId });
  }

  async updateRolePermissions(
    roleId: string | Types.ObjectId,
    permissions: PermissionType[]
  ): Promise<IRolePermissionDocument> {
    const rolePermission = await RolePermissionModel.findOneAndUpdate(
      { roleId },
      { permissions },
      { new: true, upsert: true }
    );
    if (!rolePermission) {
      throw new AppError("Failed to update role permissions", 500);
    }
    return rolePermission;
  }
}

export const rolePermissionService = new RolePermissionService();
export default rolePermissionService;
