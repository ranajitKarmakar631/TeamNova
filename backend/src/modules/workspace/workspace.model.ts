import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { generateInviteCode } from "../../common/utils/uuid";

export interface IWorkspace {
  name: string;
  slug: string;
  type: string;
  status: string;
  description?: string | null;
  owner?: Types.ObjectId;
  ownerId?: Types.ObjectId | null;
  inviteCode?: string;
  profileImg?: string | null;
  coverImg?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWorkspaceDocument extends IWorkspace, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  resetInviteCode(): void;
}

export type WorkspaceDocument = IWorkspaceDocument;

export const WorkspaceSchema = new Schema<IWorkspaceDocument>(
  {
    name: {
      type: String,
      required: [true, "Workspace name is required"],
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: [true, "Workspace slug is required"],
      trim: true,
      lowercase: true,
      alias: "Wslug",
    },
    description: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    inviteCode: {
      type: String,
      unique: true,
      default: generateInviteCode,
    },
    profileImg: {
      type: String,
      default: null,
    },
    coverImg: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ["personal", "business"],
      default: "personal",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

WorkspaceSchema.index({ slug: 1 }, { unique: true });
WorkspaceSchema.index({ name: 1 });
WorkspaceSchema.index({ ownerId: 1 });
WorkspaceSchema.index({ owner: 1 });

WorkspaceSchema.methods.resetInviteCode = function () {
  this.inviteCode = generateInviteCode();
};

WorkspaceSchema.pre("validate", function (this: IWorkspaceDocument, next) {
  if (this.name && (!this.slug || this.isModified("name"))) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
  if (this.owner && !this.ownerId) {
    this.ownerId = this.owner;
  }
  if (!this.owner && this.ownerId) {
    this.owner = this.ownerId;
  }
  if (!this.inviteCode) {
    this.inviteCode = generateInviteCode();
  }
  if (typeof next === "function") next();
});

export const WorkspaceModel: Model<IWorkspaceDocument> =
  (mongoose.models.Workspace as Model<IWorkspaceDocument>) ||
  mongoose.model<IWorkspaceDocument>("Workspace", WorkspaceSchema);

export default WorkspaceModel;
