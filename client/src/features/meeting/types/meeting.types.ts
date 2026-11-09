export type MeetingAudienceType =
  | "WORKSPACE"
  | "PROJECT"
  | "TEAM"
  | "MULTIPLE_TEAMS"
  | "CUSTOM"
  | "INDIVIDUAL";

export type MeetingStatusType =
  | "DRAFT"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type ParticipantRoleType =
  | "ORGANIZER"
  | "CO_ORGANIZER"
  | "PRESENTER"
  | "PARTICIPANT"
  | "OPTIONAL";

export type InvitationStatusType =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "TENTATIVE";

export type AttendanceStatusType =
  | "NOT_JOINED"
  | "JOINED"
  | "LEFT"
  | "ATTENDED"
  | "ABSENT";

export type TopicPriorityType = "LOW" | "MEDIUM" | "HIGH";
export type TopicStatusType =
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "DISCUSSED"
  | "DEFERRED";

export type ActionItemStatusType =
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CONVERTED_TO_TASK"
  | "CANCELLED";

export type ActionItemPriorityType = "LOW" | "MEDIUM" | "HIGH";

export interface IMeetingUser {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

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

export interface IMeeting {
  _id: string;
  workspaceId: string;
  organizerId: IMeetingUser;
  coOrganizerIds?: IMeetingUser[];
  title: string;
  description: string;
  audience: MeetingAudienceType;
  projectId?: { _id: string; name: string; emoji?: string } | null;
  teamIds?: Array<{ _id: string; name: string }>;
  startAt: string;
  endAt: string;
  timezone: string;
  meetingLink?: string;
  meetingProvider?: string;
  status: MeetingStatusType;
  reminderSettings: IReminderSettings;
  agendaSubmissionDeadline?: string | null;
  isAgendaFinalized: boolean;
  scheduleVersion: number;
  cancelledAt?: string | null;
  cancelledBy?: IMeetingUser | null;
  cancelReason?: string | null;
  completedAt?: string | null;
  attachments?: IMeetingAttachment[];
  participantCount?: number;
  participants?: IMeetingParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface IMeetingParticipant {
  _id: string;
  meetingId: string;
  workspaceId: string;
  userId: IMeetingUser;
  role: ParticipantRoleType;
  invitationStatus: InvitationStatusType;
  attendanceStatus: AttendanceStatusType;
  invitedBy?: IMeetingUser | null;
  invitedAt: string;
  respondedAt?: string | null;
  declineReason?: string | null;
  joinedAt?: string | null;
  leftAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IMeetingTopic {
  _id: string;
  meetingId: string;
  workspaceId: string;
  title: string;
  description: string;
  createdBy: IMeetingUser;
  assignedTo?: IMeetingUser | null;
  source: "ORGANIZER" | "PARTICIPANT";
  priority: TopicPriorityType;
  status: TopicStatusType;
  order: number;
  attachments: IMeetingAttachment[];
  reviewedBy?: IMeetingUser | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IMeetingMinutes {
  _id: string;
  meetingId: string;
  workspaceId: string;
  summary: string;
  decisions: string[];
  unresolvedIssues: string[];
  recordedBy: IMeetingUser;
  updatedBy?: IMeetingUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface IMeetingActionItem {
  _id: string;
  meetingId: string;
  workspaceId: string;
  topicId?: string | null;
  title: string;
  description: string;
  assignedTo?: IMeetingUser | null;
  createdBy: IMeetingUser;
  priority: ActionItemPriorityType;
  status: ActionItemStatusType;
  dueAt?: string | null;
  linkedTaskId?: { _id: string; title: string; status: string; priority: string } | null;
  convertedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IMeetingActivity {
  _id: string;
  workspaceId: string;
  meetingId: string;
  actorId: IMeetingUser;
  action: string;
  entityType?: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface IMeetingStats {
  upcoming: number;
  thisWeek: number;
  myMeetings: number;
  past: number;
}

export interface CreateMeetingPayload {
  workspaceId: string;
  data: {
    title: string;
    description?: string;
    audience?: MeetingAudienceType;
    projectId?: string | null;
    teamIds?: string[];
    startAt: string | Date;
    endAt: string | Date;
    timezone?: string;
    meetingLink?: string;
    meetingProvider?: string;
    participantUserIds?: string[];
    coOrganizerIds?: string[];
    topics?: Array<{
      title: string;
      description?: string;
      priority?: TopicPriorityType;
      assignedTo?: string | null;
    }>;
    reminderSettings?: Partial<IReminderSettings>;
    agendaSubmissionDeadline?: string | Date | null;
    attachments?: IMeetingAttachment[];
  };
}

export interface GetAllMeetingsQuery {
  workspaceId: string;
  page?: number;
  limit?: number;
  status?: MeetingStatusType;
  audience?: MeetingAudienceType;
  projectId?: string;
  teamId?: string;
  myMeetings?: boolean;
  search?: string;
  from?: string;
  to?: string;
}

