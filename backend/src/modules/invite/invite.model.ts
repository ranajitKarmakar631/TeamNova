import mongoose, { Schema, Types, Model } from "mongoose";
import {
  WorkspaceRoles,
  WorkspaceRoleType,
} from "../../common/enums/association.enum";

export type InvitationMethod = "EMAIL" | "LINK";

export type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "EXPIRED"
  | "REVOKED";

export type InvitationRoleType = Exclude<WorkspaceRoleType, "OWNER">;

export interface IWorkspaceInvitation {
  workspaceId: Types.ObjectId;
  invitedBy: Types.ObjectId;
  method: InvitationMethod;
  email?: string;
  tokenHash: string;
  role: InvitationRoleType;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: Types.ObjectId[];
  maxUses?: number;
  usedCount: number;

  createdAt?: Date;
  updatedAt?: Date;
}

const workspaceInvitationSchema =
  new Schema<IWorkspaceInvitation>(
    {
      workspaceId: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
        index: true,
      },

      invitedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      method: {
        type: String,
        enum: ["EMAIL", "LINK"],
        required: true,
      },

      email: {
        type: String,
        lowercase: true,
        trim: true,
      },

      tokenHash: {
        type: String,
        required: true,
        unique: true,
        select: false,
      },

      role: {
        type: String,
        enum: [
          WorkspaceRoles.ADMIN,
          WorkspaceRoles.MANAGER,
          WorkspaceRoles.EMPLOYEE,
        ],
        default: WorkspaceRoles.EMPLOYEE,
        required: true,
      },

      status: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"],
        default: "PENDING",
        required: true,
      },

      expiresAt: {
        type: Date,
        required: true,
        index: true,
      },

      acceptedAt: Date,

      acceptedBy: {
        type: [Schema.Types.ObjectId],
        ref: "User",
      },

      maxUses: {
        type: Number,
        min: 1,
      },

      usedCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    { timestamps: true }
  );

workspaceInvitationSchema.index({
  workspaceId: 1,
  status: 1,
});

workspaceInvitationSchema.index({
  workspaceId: 1,
  email: 1,
  status: 1,
});

export const WorkspaceInvitation: Model<IWorkspaceInvitation> =
  mongoose.model<IWorkspaceInvitation>(
    "WorkspaceInvitation",
    workspaceInvitationSchema
  );

export default WorkspaceInvitation;