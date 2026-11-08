import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type TeamStatus = "ACTIVE" | "ARCHIVED" | "INACTIVE";

export interface ITeam {
  workspaceId: Types.ObjectId;
  projectId?: Types.ObjectId | null;
  name: string;
  slug?: string;
  description?: string | null;
  createdBy: Types.ObjectId;
  status: TeamStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITeamDocument extends ITeam, Document<Types.ObjectId> {
  _id: Types.ObjectId;
}

export const TeamSchema = new Schema<ITeamDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace ID is required"],
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "CreatedBy user ID is required"],
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);
TeamSchema.index({ workspaceId: 1, projectId: 1, name: 1 }, { unique: true });
TeamSchema.index({ workspaceId: 1, name: 1 });
TeamSchema.index({ workspaceId: 1, slug: 1 }, { unique: true, sparse: true });
TeamSchema.index({ workspaceId: 1, status: 1 });
TeamSchema.index({ projectId: 1, status: 1 });
TeamSchema.index({ createdBy: 1 });

TeamSchema.pre("save", function (this: ITeamDocument, next) {
  if (this.name && (!this.slug || this.isModified("name"))) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});


export const TeamModel: Model<ITeamDocument> =
  (mongoose.models.Team as Model<ITeamDocument>) ||
  mongoose.model<ITeamDocument>("Team", TeamSchema);

export default TeamModel;
