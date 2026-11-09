import mongoose, { Document, Schema } from "mongoose";

export interface MeetingMinutesDocument extends Document {
  _id: mongoose.Types.ObjectId;
  meetingId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  summary: string;
  decisions: string[];
  unresolvedIssues: string[];
  recordedBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const meetingMinutesSchema = new Schema<MeetingMinutesDocument>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      unique: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    summary: {
      type: String,
      default: "",
    },
    decisions: {
      type: [String],
      default: [],
    },
    unresolvedIssues: {
      type: [String],
      default: [],
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

meetingMinutesSchema.index({ workspaceId: 1, meetingId: 1 });

const MeetingMinutesModel = mongoose.model<MeetingMinutesDocument>(
  "MeetingMinutes",
  meetingMinutesSchema
);

export default MeetingMinutesModel;
