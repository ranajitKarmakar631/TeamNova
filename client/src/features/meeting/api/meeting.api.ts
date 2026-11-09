import API from "@/lib/axios-client";
import {
  CreateMeetingPayload,
  GetAllMeetingsQuery,
  IMeeting,
  IMeetingActionItem,
  IMeetingActivity,
  IMeetingMinutes,
  IMeetingParticipant,
  IMeetingStats,
  IMeetingTopic,
  InvitationStatusType,
  AttendanceStatusType,
} from "../types/meeting.types";

export const createMeetingApi = async ({
  workspaceId,
  data,
}: CreateMeetingPayload): Promise<{ meeting: IMeeting; message: string }> => {
  const response = await API.post(`/meetings/${workspaceId}`, data);
  return response.data;
};

export const getAllMeetingsApi = async ({
  workspaceId,
  page = 1,
  limit = 20,
  status,
  audience,
  projectId,
  teamId,
  myMeetings,
  search,
  from,
  to,
}: GetAllMeetingsQuery): Promise<{
  meetings: IMeeting[];
  totalCount: number;
  totalPages: number;
  page: number;
  limit: number;
}> => {
  const params = new URLSearchParams();
  if (page) params.append("page", String(page));
  if (limit) params.append("limit", String(limit));
  if (status) params.append("status", status);
  if (audience) params.append("audience", audience);
  if (projectId) params.append("projectId", projectId);
  if (teamId) params.append("teamId", teamId);
  if (myMeetings !== undefined) params.append("myMeetings", String(myMeetings));
  if (search) params.append("search", search);
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const response = await API.get(`/meetings/${workspaceId}?${params.toString()}`);
  return response.data;
};

export const getMeetingStatsApi = async (
  workspaceId: string
): Promise<{ stats: IMeetingStats }> => {
  const response = await API.get(`/meetings/${workspaceId}/stats`);
  return response.data;
};

export const getCalendarMeetingsApi = async (
  workspaceId: string,
  start: string,
  end: string,
  filterType?: string
): Promise<{ meetings: IMeeting[] }> => {
  const params = new URLSearchParams({ start, end });
  if (filterType) params.append("filterType", filterType);
  const response = await API.get(`/meetings/${workspaceId}/calendar?${params.toString()}`);
  return response.data;
};

export const getMeetingByIdApi = async (
  workspaceId: string,
  meetingId: string
): Promise<{
  meeting: IMeeting;
  participants: IMeetingParticipant[];
  topics: IMeetingTopic[];
  minutes: IMeetingMinutes | null;
  actionItems: IMeetingActionItem[];
  currentParticipant: IMeetingParticipant | null;
}> => {
  const response = await API.get(`/meetings/${workspaceId}/${meetingId}`);
  return response.data;
};

export const updateMeetingApi = async (
  workspaceId: string,
  meetingId: string,
  data: Partial<IMeeting>
): Promise<{ meeting: IMeeting }> => {
  const response = await API.patch(`/meetings/${workspaceId}/${meetingId}`, data);
  return response.data;
};

export const rescheduleMeetingApi = async (
  workspaceId: string,
  meetingId: string,
  data: { startAt: string | Date; endAt: string | Date; timezone?: string }
): Promise<{ meeting: IMeeting }> => {
  const response = await API.patch(
    `/meetings/${workspaceId}/${meetingId}/reschedule`,
    data
  );
  return response.data;
};

export const cancelMeetingApi = async (
  workspaceId: string,
  meetingId: string,
  cancelReason?: string
): Promise<{ meeting: IMeeting }> => {
  const response = await API.patch(`/meetings/${workspaceId}/${meetingId}/cancel`, {
    cancelReason,
  });
  return response.data;
};

export const startMeetingApi = async (
  workspaceId: string,
  meetingId: string
): Promise<{ meeting: IMeeting }> => {
  const response = await API.patch(`/meetings/${workspaceId}/${meetingId}/start`);
  return response.data;
};

export const completeMeetingApi = async (
  workspaceId: string,
  meetingId: string
): Promise<{ meeting: IMeeting }> => {
  const response = await API.patch(`/meetings/${workspaceId}/${meetingId}/complete`);
  return response.data;
};

export const addParticipantsApi = async (
  workspaceId: string,
  meetingId: string,
  data: { userIds: string[]; role?: string }
): Promise<{ participants: IMeetingParticipant[] }> => {
  const response = await API.post(
    `/meetings/${workspaceId}/${meetingId}/participants`,
    data
  );
  return response.data;
};

export const removeParticipantApi = async (
  workspaceId: string,
  meetingId: string,
  targetUserId: string
): Promise<{ message: string }> => {
  const response = await API.delete(
    `/meetings/${workspaceId}/${meetingId}/participants/${targetUserId}`
  );
  return response.data;
};

export const rsvpMeetingApi = async (
  workspaceId: string,
  meetingId: string,
  data: { status: InvitationStatusType; declineReason?: string | null }
): Promise<{ participant: IMeetingParticipant }> => {
  const response = await API.patch(
    `/meetings/${workspaceId}/${meetingId}/rsvp`,
    data
  );
  return response.data;
};

export const recordAttendanceApi = async (
  workspaceId: string,
  meetingId: string,
  data: { attendanceStatus: AttendanceStatusType }
): Promise<{ participant: IMeetingParticipant }> => {
  const response = await API.patch(
    `/meetings/${workspaceId}/${meetingId}/attendance`,
    data
  );
  return response.data;
};

export const createTopicApi = async (
  workspaceId: string,
  meetingId: string,
  data: {
    title: string;
    description?: string;
    priority?: string;
    assignedTo?: string | null;
    attachments?: any[];
  }
): Promise<{ topic: IMeetingTopic }> => {
  const response = await API.post(`/meetings/${workspaceId}/${meetingId}/topics`, data);
  return response.data;
};

export const updateTopicApi = async (
  workspaceId: string,
  meetingId: string,
  topicId: string,
  data: Partial<IMeetingTopic>
): Promise<{ topic: IMeetingTopic }> => {
  const response = await API.patch(
    `/meetings/${workspaceId}/${meetingId}/topics/${topicId}`,
    data
  );
  return response.data;
};

export const reviewTopicApi = async (
  workspaceId: string,
  meetingId: string,
  topicId: string,
  status: "APPROVED" | "REJECTED"
): Promise<{ topic: IMeetingTopic }> => {
  const response = await API.patch(
    `/meetings/${workspaceId}/${meetingId}/topics/${topicId}/review`,
    { status }
  );
  return response.data;
};

export const deleteTopicApi = async (
  workspaceId: string,
  meetingId: string,
  topicId: string
): Promise<{ message: string }> => {
  const response = await API.delete(
    `/meetings/${workspaceId}/${meetingId}/topics/${topicId}`
  );
  return response.data;
};

export const reorderTopicsApi = async (
  workspaceId: string,
  meetingId: string,
  topicIds: string[]
): Promise<{ message: string }> => {
  const response = await API.patch(
    `/meetings/${workspaceId}/${meetingId}/topics/reorder`,
    { topicIds }
  );
  return response.data;
};

export const finalizeAgendaApi = async (
  workspaceId: string,
  meetingId: string
): Promise<{ meeting: IMeeting }> => {
  const response = await API.patch(
    `/meetings/${workspaceId}/${meetingId}/finalize-agenda`
  );
  return response.data;
};

export const upsertMinutesApi = async (
  workspaceId: string,
  meetingId: string,
  data: { summary?: string; decisions?: string[]; unresolvedIssues?: string[] }
): Promise<{ minutes: IMeetingMinutes }> => {
  const response = await API.put(
    `/meetings/${workspaceId}/${meetingId}/minutes`,
    data
  );
  return response.data;
};

export const createActionItemApi = async (
  workspaceId: string,
  meetingId: string,
  data: {
    title: string;
    description?: string;
    assignedTo?: string | null;
    priority?: string;
    dueAt?: string | Date | null;
    topicId?: string | null;
  }
): Promise<{ actionItem: IMeetingActionItem }> => {
  const response = await API.post(
    `/meetings/${workspaceId}/${meetingId}/action-items`,
    data
  );
  return response.data;
};

export const updateActionItemApi = async (
  workspaceId: string,
  meetingId: string,
  actionItemId: string,
  data: Partial<IMeetingActionItem>
): Promise<{ actionItem: IMeetingActionItem }> => {
  const response = await API.patch(
    `/meetings/${workspaceId}/${meetingId}/action-items/${actionItemId}`,
    data
  );
  return response.data;
};

export const convertActionItemToTaskApi = async (
  workspaceId: string,
  meetingId: string,
  actionItemId: string,
  data: {
    projectId: string;
    teamId?: string | null;
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string | null;
  }
): Promise<{ actionItem: IMeetingActionItem; task: any }> => {
  const response = await API.post(
    `/meetings/${workspaceId}/${meetingId}/action-items/${actionItemId}/convert-to-task`,
    data
  );
  return response.data;
};

export const getMeetingActivitiesApi = async (
  workspaceId: string,
  meetingId: string
): Promise<{ activities: IMeetingActivity[] }> => {
  const response = await API.get(
    `/meetings/${workspaceId}/${meetingId}/activities`
  );
  return response.data;
};

export const resolveAudiencePreviewApi = async (
  workspaceId: string,
  data: {
    audience: string;
    projectId?: string | null;
    teamIds?: string[];
    customUserIds?: string[];
  }
): Promise<{ memberIds: string[]; count: number }> => {
  const response = await API.post(
    `/meetings/${workspaceId}/resolve-audience`,
    data
  );
  return response.data;
};

