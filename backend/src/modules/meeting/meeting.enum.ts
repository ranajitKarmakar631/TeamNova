export const MeetingAudience = {
  WORKSPACE: "WORKSPACE",
  PROJECT: "PROJECT",
  TEAM: "TEAM",
  MULTIPLE_TEAMS: "MULTIPLE_TEAMS",
  CUSTOM: "CUSTOM",
  INDIVIDUAL: "INDIVIDUAL",
} as const;

export type MeetingAudienceType =
  (typeof MeetingAudience)[keyof typeof MeetingAudience];

export const MeetingStatus = {
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type MeetingStatusType =
  (typeof MeetingStatus)[keyof typeof MeetingStatus];

export const ParticipantRole = {
  ORGANIZER: "ORGANIZER",
  CO_ORGANIZER: "CO_ORGANIZER",
  PRESENTER: "PRESENTER",
  PARTICIPANT: "PARTICIPANT",
  OPTIONAL: "OPTIONAL",
} as const;

export type ParticipantRoleType =
  (typeof ParticipantRole)[keyof typeof ParticipantRole];

export const InvitationStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  TENTATIVE: "TENTATIVE",
} as const;

export type InvitationStatusType =
  (typeof InvitationStatus)[keyof typeof InvitationStatus];

export const AttendanceStatus = {
  NOT_JOINED: "NOT_JOINED",
  JOINED: "JOINED",
  LEFT: "LEFT",
  ATTENDED: "ATTENDED",
  ABSENT: "ABSENT",
} as const;

export type AttendanceStatusType =
  (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const TopicSource = {
  ORGANIZER: "ORGANIZER",
  PARTICIPANT: "PARTICIPANT",
} as const;

export type TopicSourceType =
  (typeof TopicSource)[keyof typeof TopicSource];

export const TopicStatus = {
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  DISCUSSED: "DISCUSSED",
  DEFERRED: "DEFERRED",
} as const;

export type TopicStatusType =
  (typeof TopicStatus)[keyof typeof TopicStatus];

export const TopicPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

export type TopicPriorityType =
  (typeof TopicPriority)[keyof typeof TopicPriority];

export const ActionItemStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CONVERTED_TO_TASK: "CONVERTED_TO_TASK",
  CANCELLED: "CANCELLED",
} as const;

export type ActionItemStatusType =
  (typeof ActionItemStatus)[keyof typeof ActionItemStatus];

export const ActionItemPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

export type ActionItemPriorityType =
  (typeof ActionItemPriority)[keyof typeof ActionItemPriority];

export const MeetingActivityAction = {
  MEETING_CREATED: "MEETING_CREATED",
  MEETING_UPDATED: "MEETING_UPDATED",
  MEETING_RESCHEDULED: "MEETING_RESCHEDULED",
  MEETING_CANCELLED: "MEETING_CANCELLED",
  PARTICIPANT_INVITED: "PARTICIPANT_INVITED",
  PARTICIPANT_ACCEPTED: "PARTICIPANT_ACCEPTED",
  PARTICIPANT_DECLINED: "PARTICIPANT_DECLINED",
  TOPIC_SUBMITTED: "TOPIC_SUBMITTED",
  TOPIC_APPROVED: "TOPIC_APPROVED",
  TOPIC_REJECTED: "TOPIC_REJECTED",
  AGENDA_FINALIZED: "AGENDA_FINALIZED",
  MEETING_STARTED: "MEETING_STARTED",
  MEETING_COMPLETED: "MEETING_COMPLETED",
  MINUTES_UPDATED: "MINUTES_UPDATED",
  ACTION_ITEM_CREATED: "ACTION_ITEM_CREATED",
  ACTION_ITEM_CONVERTED: "ACTION_ITEM_CONVERTED",
} as const;

export type MeetingActivityActionType =
  (typeof MeetingActivityAction)[keyof typeof MeetingActivityAction];

