import mongoose, { Document, Schema } from "mongoose";
import {
  MeetingAudience,
  MeetingAudienceType,
  MeetingStatus,
  MeetingStatusType,
} from "./meeting.enum";

export interface IReminderSettings {
  dailyReminder: boolean;
  fifteenMinutesBefore: boolean;
  fiveMinutesBefore: boolean;
  meetingStartNotification: boolean;
}

export interface IMeetingAttachment {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

export interface MeetingDocument extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  organizerId: mongoose.Types.ObjectId;
  coOrganizerIds: mongoose.Types.ObjectId[];
  title: string;
  description: string;
  audience: MeetingAudienceType;
  projectId?: mongoose.Types.ObjectId | null;
  teamIds: mongoose.Types.ObjectId[];
  startAt: Date;
  endAt: Date;
  timezone: string;
  meetingLink?: string;
  meetingProvider?: string;
  status: MeetingStatusType;
  reminderSettings: IReminderSettings;
  agendaSubmissionDeadline?: Date | null;
  isAgendaFinalized: boolean;
  scheduleVersion: number;
  cancelledAt?: Date | null;
  cancelledBy?: mongoose.Types.ObjectId | null;
  cancelReason?: string | null;
  completedAt?: Date | null;
  attachments: IMeetingAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const meetingAttachmentSchema = new Schema<IMeetingAttachment>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const reminderSettingsSchema = new Schema<IReminderSettings>(
  {
    dailyReminder: { type: Boolean, default: true },
    fifteenMinutesBefore: { type: Boolean, default: true },
    fiveMinutesBefore: { type: Boolean, default: true },
    meetingStartNotification: { type: Boolean, default: true },
  },
  { _id: false }
);

const meetingSchema = new Schema<MeetingDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    coOrganizerIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    audience: {
      type: String,
      enum: Object.values(MeetingAudience),
      required: true,
      default: MeetingAudience.WORKSPACE,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    teamIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
      required: true,
      index: true,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    meetingLink: {
      type: String,
      default: "",
    },
    meetingProvider: {
      type: String,
      default: "GOOGLE_MEET",
    },
    status: {
      type: String,
      enum: Object.values(MeetingStatus),
      default: MeetingStatus.SCHEDULED,
      index: true,
    },
    reminderSettings: {
      type: reminderSettingsSchema,
      default: () => ({}),
    },
    agendaSubmissionDeadline: {
      type: Date,
      default: null,
    },
    isAgendaFinalized: {
      type: Boolean,
      default: false,
    },
    scheduleVersion: {
      type: Number,
      default: 1,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    attachments: {
      type: [meetingAttachmentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

meetingSchema.index({ workspaceId: 1, startAt: 1 });
meetingSchema.index({ workspaceId: 1, status: 1 });
meetingSchema.index({ workspaceId: 1, organizerId: 1 });
meetingSchema.index({ workspaceId: 1, projectId: 1 });
meetingSchema.index({ workspaceId: 1, teamIds: 1 });

const MeetingModel = mongoose.model<MeetingDocument>("Meeting", meetingSchema);
export default MeetingModel;
