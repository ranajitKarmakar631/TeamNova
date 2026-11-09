import { z } from "zod";
import {
  ActionItemPriority,
  ActionItemStatus,
  AttendanceStatus,
  InvitationStatus,
  MeetingAudience,
  MeetingStatus,
  ParticipantRole,
  TopicPriority,
  TopicStatus,
} from "./meeting.enum";

export const meetingIdSchema = z.string().trim().min(1, "Meeting ID is required");
export const topicIdSchema = z.string().trim().min(1, "Topic ID is required");
export const actionItemIdSchema = z.string().trim().min(1, "Action Item ID is required");

const attachmentSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  type: z.string().optional().default(""),
  size: z.number().optional().default(0),
});

export const reminderSettingsSchema = z.object({
  dailyReminder: z.boolean().optional().default(true),
  fifteenMinutesBefore: z.boolean().optional().default(true),
  fiveMinutesBefore: z.boolean().optional().default(true),
  meetingStartNotification: z.boolean().optional().default(true),
});

export const createMeetingSchema = z.object({
  title: z.string().trim().min(1, "Meeting title is required").max(200),
  description: z.string().optional().default(""),
  audience: z
    .nativeEnum(MeetingAudience)
    .optional()
    .default(MeetingAudience.WORKSPACE),
  projectId: z.string().trim().optional().nullable(),
  teamIds: z.array(z.string().trim()).optional().default([]),
  startAt: z.string().or(z.date()),
  endAt: z.string().or(z.date()),
  timezone: z.string().trim().optional().default("UTC"),
  meetingLink: z.string().trim().optional().default(""),
  meetingProvider: z.string().trim().optional().default("GOOGLE_MEET"),
  participantUserIds: z.array(z.string().trim()).optional().default([]),
  coOrganizerIds: z.array(z.string().trim()).optional().default([]),
  topics: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        description: z.string().optional().default(""),
        priority: z.nativeEnum(TopicPriority).optional().default(TopicPriority.MEDIUM),
        assignedTo: z.string().trim().optional().nullable(),
      })
    )
    .optional()
    .default([]),
  reminderSettings: reminderSettingsSchema.optional().default({}),
  agendaSubmissionDeadline: z.string().or(z.date()).optional().nullable(),
  attachments: z.array(attachmentSchema).optional().default([]),
});

export const updateMeetingSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().optional(),
  meetingLink: z.string().trim().optional(),
  meetingProvider: z.string().trim().optional(),
  reminderSettings: reminderSettingsSchema.optional(),
  agendaSubmissionDeadline: z.string().or(z.date()).optional().nullable(),
  attachments: z.array(attachmentSchema).optional(),
});

export const rescheduleMeetingSchema = z.object({
  startAt: z.string().or(z.date()),
  endAt: z.string().or(z.date()),
  timezone: z.string().trim().optional(),
});

export const cancelMeetingSchema = z.object({
  cancelReason: z.string().trim().max(500).optional().default("Cancelled by organizer"),
});

export const addParticipantsSchema = z.object({
  userIds: z.array(z.string().trim().min(1)).min(1, "At least one participant required"),
  role: z.nativeEnum(ParticipantRole).optional().default(ParticipantRole.PARTICIPANT),
});

export const rsvpMeetingSchema = z.object({
  status: z.enum([
    InvitationStatus.ACCEPTED,
    InvitationStatus.DECLINED,
    InvitationStatus.TENTATIVE,
  ]),
  declineReason: z.string().trim().max(300).optional().nullable(),
});

export const attendanceSchema = z.object({
  attendanceStatus: z.nativeEnum(AttendanceStatus),
});

export const createTopicSchema = z.object({
  title: z.string().trim().min(1, "Topic title is required").max(300),
  description: z.string().optional().default(""),
  priority: z.nativeEnum(TopicPriority).optional().default(TopicPriority.MEDIUM),
  assignedTo: z.string().trim().optional().nullable(),
  attachments: z.array(attachmentSchema).optional().default([]),
});

export const updateTopicSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().optional(),
  priority: z.nativeEnum(TopicPriority).optional(),
  assignedTo: z.string().trim().optional().nullable(),
  status: z.nativeEnum(TopicStatus).optional(),
  attachments: z.array(attachmentSchema).optional(),
});

export const reviewTopicSchema = z.object({
  status: z.enum([TopicStatus.APPROVED, TopicStatus.REJECTED]),
});

export const reorderTopicsSchema = z.object({
  topicIds: z.array(z.string().trim().min(1)).min(1),
});

export const upsertMinutesSchema = z.object({
  summary: z.string().optional().default(""),
  decisions: z.array(z.string()).optional().default([]),
  unresolvedIssues: z.array(z.string()).optional().default([]),
});

export const createActionItemSchema = z.object({
  topicId: z.string().trim().optional().nullable(),
  title: z.string().trim().min(1, "Action item title is required").max(300),
  description: z.string().optional().default(""),
  assignedTo: z.string().trim().optional().nullable(),
  priority: z.nativeEnum(ActionItemPriority).optional().default(ActionItemPriority.MEDIUM),
  dueAt: z.string().or(z.date()).optional().nullable(),
});

export const updateActionItemSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().optional(),
  assignedTo: z.string().trim().optional().nullable(),
  priority: z.nativeEnum(ActionItemPriority).optional(),
  status: z.nativeEnum(ActionItemStatus).optional(),
  dueAt: z.string().or(z.date()).optional().nullable(),
});

export const convertActionItemToTaskSchema = z.object({
  projectId: z.string().trim().min(1, "Project ID is required"),
  teamId: z.string().trim().optional().nullable(),
  title: z.string().trim().optional(),
  description: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  dueDate: z.string().optional().nullable(),
});

export const getMeetingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.nativeEnum(MeetingStatus).optional(),
  audience: z.nativeEnum(MeetingAudience).optional(),
  projectId: z.string().trim().optional(),
  teamId: z.string().trim().optional(),
  myMeetings: z
    .preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
  search: z.string().trim().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

