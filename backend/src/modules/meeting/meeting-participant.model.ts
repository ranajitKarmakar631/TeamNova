import mongoose, { Document, Schema } from "mongoose";
import {
  AttendanceStatus,
  AttendanceStatusType,
  InvitationStatus,
  InvitationStatusType,
  ParticipantRole,
  ParticipantRoleType,
} from "./meeting.enum";

export interface MeetingParticipantDocument extends Document {
  _id: mongoose.Types.ObjectId;
  meetingId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: ParticipantRoleType;
  invitationStatus: InvitationStatusType;
  attendanceStatus: AttendanceStatusType;
  invitedBy?: mongoose.Types.ObjectId | null;
  invitedAt: Date;
  respondedAt?: Date | null;
  declineReason?: string | null;
  joinedAt?: Date | null;
  leftAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const meetingParticipantSchema = new Schema<MeetingParticipantDocument>(
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(ParticipantRole),
      default: ParticipantRole.PARTICIPANT,
      required: true,
    },
    invitationStatus: {
      type: String,
      enum: Object.values(InvitationStatus),
      default: InvitationStatus.PENDING,
      required: true,
      index: true,
    },
    attendanceStatus: {
      type: String,
      enum: Object.values(AttendanceStatus),
      default: AttendanceStatus.NOT_JOINED,
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    declineReason: {
      type: String,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
    leftAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring each user is added to a meeting only once
meetingParticipantSchema.index({ meetingId: 1, userId: 1 }, { unique: true });
meetingParticipantSchema.index({ workspaceId: 1, userId: 1 });
meetingParticipantSchema.index({ meetingId: 1, invitationStatus: 1 });

const MeetingParticipantModel = mongoose.model<MeetingParticipantDocument>(
  "MeetingParticipant",
  meetingParticipantSchema
);

export default MeetingParticipantModel;
