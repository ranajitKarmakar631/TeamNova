import mongoose, { Document, Schema } from "mongoose";
import {
  ActionItemPriority,
  ActionItemPriorityType,
  ActionItemStatus,
  ActionItemStatusType,
} from "./meeting.enum";

export interface MeetingActionItemDocument extends Document {
  _id: mongoose.Types.ObjectId;
  meetingId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  topicId?: mongoose.Types.ObjectId | null;
  title: string;
  description: string;
  assignedTo?: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  priority: ActionItemPriorityType;
  status: ActionItemStatusType;
  dueAt?: Date | null;
  linkedTaskId?: mongoose.Types.ObjectId | null;
  convertedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const meetingActionItemSchema = new Schema<MeetingActionItemDocument>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "MeetingTopic",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(ActionItemPriority),
      default: ActionItemPriority.MEDIUM,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ActionItemStatus),
      default: ActionItemStatus.OPEN,
      required: true,
      index: true,
    },
    dueAt: {
      type: Date,
      default: null,
    },
    linkedTaskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    convertedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

meetingActionItemSchema.index({ workspaceId: 1, meetingId: 1 });
meetingActionItemSchema.index({ linkedTaskId: 1 });

const MeetingActionItemModel = mongoose.model<MeetingActionItemDocument>(
  "MeetingActionItem",
  meetingActionItemSchema
);

export default MeetingActionItemModel;
