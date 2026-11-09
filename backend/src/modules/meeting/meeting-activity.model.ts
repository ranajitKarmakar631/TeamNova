import mongoose, { Document, Schema } from "mongoose";
import {
  MeetingActivityAction,
  MeetingActivityActionType,
} from "./meeting.enum";

export interface MeetingActivityDocument extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  meetingId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  action: MeetingActivityActionType;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const meetingActivitySchema = new Schema<MeetingActivityDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(MeetingActivityAction),
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      default: "",
    },
    entityId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

meetingActivitySchema.index({ meetingId: 1, createdAt: -1 });

const MeetingActivityModel = mongoose.model<MeetingActivityDocument>(
  "MeetingActivity",
  meetingActivitySchema
);

export default MeetingActivityModel;
