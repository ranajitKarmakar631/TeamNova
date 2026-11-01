import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

import {
  AssociationRoles,
  AssociationRoleType,
  AssociationScope,
  AssociationScopeType,
} from "../../common/enums/association.enum";

export const AssociationStatus = {
  ACTIVE: "ACTIVE",
  REMOVED: "REMOVED",
} as const;

export type AssociationStatusType =
  (typeof AssociationStatus)[keyof typeof AssociationStatus];

export interface IAssociation {
  memberId: Types.ObjectId;

  workspaceId: Types.ObjectId;

  scopeType: AssociationScopeType;

  scopeId: Types.ObjectId;

  role: AssociationRoleType;

  status: AssociationStatusType;

  joinedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAssociationDocument
  extends IAssociation,
    Document<Types.ObjectId> {
  _id: Types.ObjectId;
}

export const AssociationSchema =
  new Schema<IAssociationDocument>(
    {
      memberId: {
        type: Schema.Types.ObjectId,
        ref: "Member",
        required: true,
      },

      workspaceId: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
      },

      scopeType: {
        type: String,
        enum: Object.values(AssociationScope),
        required: true,
      },

      scopeId: {
        type: Schema.Types.ObjectId,
        required: true,
      },

      role: {
        type: String,
        enum: Object.values(AssociationRoles),
        required: true,
        default: AssociationRoles.MEMBER,
      },

      status: {
        type: String,
        enum: Object.values(AssociationStatus),
        default: AssociationStatus.ACTIVE,
        required: true,
      },

      joinedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

AssociationSchema.index(
  {
    memberId: 1,
    workspaceId: 1,
    scopeType: 1,
    scopeId: 1,
  },
  {
    unique: true,
  }
);

AssociationSchema.index({
  workspaceId: 1,
  scopeType: 1,
  scopeId: 1,
  status: 1,
});

AssociationSchema.index({
  memberId: 1,
  workspaceId: 1,
});

export const AssociationModel: Model<IAssociationDocument> =
  (mongoose.models.Association as Model<IAssociationDocument>) ||
  mongoose.model<IAssociationDocument>(
    "Association",
    AssociationSchema
  );

export default AssociationModel;