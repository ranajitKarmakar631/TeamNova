import mongoose, { Document, Schema } from "mongoose";
import {
  TopicPriority,
  TopicPriorityType,
  TopicSource,
  TopicSourceType,
  TopicStatus,
  TopicStatusType,
} from "./meeting.enum";

export interface ITopicAttachment {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

export interface MeetingTopicDocument extends Document {
  _id: mongoose.Types.ObjectId;
  meetingId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId | null;
  source: TopicSourceType;
  priority: TopicPriorityType;
  status: TopicStatusType;
  order: number;
  attachments: ITopicAttachment[];
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const topicAttachmentSchema = new Schema<ITopicAttachment>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const meetingTopicSchema = new Schema<MeetingTopicDocument>(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    source: {
      type: String,
      enum: Object.values(TopicSource),
      default: TopicSource.ORGANIZER,
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(TopicPriority),
      default: TopicPriority.MEDIUM,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TopicStatus),
      default: TopicStatus.APPROVED,
      required: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    attachments: {
      type: [topicAttachmentSchema],
      default: [],
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

meetingTopicSchema.index({ meetingId: 1, order: 1 });
meetingTopicSchema.index({ meetingId: 1, status: 1 });

const MeetingTopicModel = mongoose.model<MeetingTopicDocument>(
  "MeetingTopic",
  meetingTopicSchema
);

export default MeetingTopicModel;
