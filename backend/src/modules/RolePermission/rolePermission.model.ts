import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { Permissions, PermissionType } from "../../common/enums/association.enum";

export interface IRolePermission {
  roleId: Types.ObjectId;
  permissions: PermissionType[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRolePermissionDocument extends IRolePermission, Document<Types.ObjectId> {
  _id: Types.ObjectId;
}

export const RolePermissionSchema = new Schema<IRolePermissionDocument>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role ID is required"],
    },
    permissions: {
      type: [String],
      enum: Object.values(Permissions),
      required: true,
      default: [],
    },
  },
  { timestamps: true }
);

RolePermissionSchema.index({ roleId: 1 }, { unique: true });

export const RolePermissionModel: Model<IRolePermissionDocument> =
  (mongoose.models.RolePermission as Model<IRolePermissionDocument>) ||
  mongoose.model<IRolePermissionDocument>("RolePermission", RolePermissionSchema);

export default RolePermissionModel;
