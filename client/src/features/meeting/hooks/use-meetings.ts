import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addParticipantsApi,
  cancelMeetingApi,
  completeMeetingApi,
  convertActionItemToTaskApi,
  createActionItemApi,
  createMeetingApi,
  createTopicApi,
  deleteTopicApi,
  finalizeAgendaApi,
  getAllMeetingsApi,
  getCalendarMeetingsApi,
  getMeetingActivitiesApi,
  getMeetingByIdApi,
  getMeetingStatsApi,
  recordAttendanceApi,
  removeParticipantApi,
  reorderTopicsApi,
  rescheduleMeetingApi,
  reviewTopicApi,
  rsvpMeetingApi,
  startMeetingApi,
  updateActionItemApi,
  updateMeetingApi,
  updateTopicApi,
  upsertMinutesApi,
} from "../api/meeting.api";
import { GetAllMeetingsQuery, IMeetingActionItem } from "../types/meeting.types";
import { meetingKeys } from "../meeting.keys";
import { toast } from "@/hooks/use-toast";

export const useGetAllMeetingsQuery = (params: GetAllMeetingsQuery) => {
  return useQuery({
    queryKey: meetingKeys.list(params.workspaceId, params),
    queryFn: () => getAllMeetingsApi(params),
    enabled: !!params.workspaceId,
    staleTime: 10 * 1000,
  });
};

export const useGetMeetingStatsQuery = (workspaceId: string) => {
  return useQuery({
    queryKey: meetingKeys.stats(workspaceId),
    queryFn: () => getMeetingStatsApi(workspaceId),
    enabled: !!workspaceId,
    staleTime: 15 * 1000,
  });
};

export const useGetCalendarMeetingsQuery = (
  workspaceId: string,
  start: string,
  end: string,
  filterType?: string
) => {
  return useQuery({
    queryKey: meetingKeys.calendar(workspaceId, start, end, filterType),
    queryFn: () => getCalendarMeetingsApi(workspaceId, start, end, filterType),
    enabled: !!workspaceId && !!start && !!end,
    staleTime: 15 * 1000,
  });
};

export const useGetMeetingByIdQuery = (workspaceId: string, meetingId: string) => {
  return useQuery({
    queryKey: meetingKeys.detail(workspaceId, meetingId),
    queryFn: () => getMeetingByIdApi(workspaceId, meetingId),
    enabled: !!workspaceId && !!meetingId,
    staleTime: 10 * 1000,
  });
};

export const useGetMeetingActivitiesQuery = (workspaceId: string, meetingId: string) => {
  return useQuery({
    queryKey: meetingKeys.activities(workspaceId, meetingId),
    queryFn: () => getMeetingActivitiesApi(workspaceId, meetingId),
    enabled: !!workspaceId && !!meetingId,
  });
};

// Mutations
export const useCreateMeetingMutation = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createMeetingApi({ workspaceId, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingKeys.stats(workspaceId) });
      toast({ title: "Success", description: "Meeting scheduled successfully!" });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to schedule meeting",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMeetingMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => updateMeetingApi(workspaceId, meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      toast({ title: "Success", description: "Meeting updated successfully!" });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update meeting",
        variant: "destructive",
      });
    },
  });
};

export const useRescheduleMeetingMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { startAt: string | Date; endAt: string | Date; timezone?: string }) =>
      rescheduleMeetingApi(workspaceId, meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingKeys.stats(workspaceId) });
      toast({ title: "Success", description: "Meeting rescheduled successfully!" });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to reschedule meeting",
        variant: "destructive",
      });
    },
  });
};

export const useCancelMeetingMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cancelReason?: string) =>
      cancelMeetingApi(workspaceId, meetingId, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingKeys.stats(workspaceId) });
      toast({ title: "Meeting Cancelled", description: "Meeting has been cancelled." });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to cancel meeting",
        variant: "destructive",
      });
    },
  });
};

export const useStartMeetingMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => startMeetingApi(workspaceId, meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      toast({ title: "Meeting Started", description: "Meeting status changed to In Progress." });
    },
  });
};

export const useCompleteMeetingMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => completeMeetingApi(workspaceId, meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingKeys.stats(workspaceId) });
      toast({ title: "Meeting Completed", description: "Meeting has been marked as completed." });
    },
  });
};

export const useAddParticipantsMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userIds: string[]; role?: string }) =>
      addParticipantsApi(workspaceId, meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      toast({ title: "Success", description: "Participants added successfully!" });
    },
  });
};

export const useRemoveParticipantMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) =>
      removeParticipantApi(workspaceId, meetingId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      toast({ title: "Success", description: "Participant removed." });
    },
  });
};

export const useRsvpMeetingMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: any; declineReason?: string | null }) =>
      rsvpMeetingApi(workspaceId, meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      queryClient.invalidateQueries({ queryKey: meetingKeys.stats(workspaceId) });
      toast({ title: "RSVP Updated", description: "Your response has been saved." });
    },
  });
};

export const useRecordAttendanceMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { attendanceStatus: any }) =>
      recordAttendanceApi(workspaceId, meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
    },
  });
};

export const useCreateTopicMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createTopicApi(workspaceId, meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      toast({ title: "Success", description: "Discussion topic added." });
    },
  });
};

export const useUpdateTopicMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, data }: { topicId: string; data: any }) =>
      updateTopicApi(workspaceId, meetingId, topicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
    },
  });
};

export const useReorderTopicsMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topicIds: string[]) =>
      reorderTopicsApi(workspaceId, meetingId, topicIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
    },
  });
};

export const useReviewTopicMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, status }: { topicId: string; status: "APPROVED" | "REJECTED" }) =>
      reviewTopicApi(workspaceId, meetingId, topicId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      toast({ title: "Success", description: "Topic reviewed." });
    },
  });
};

export const useDeleteTopicMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => deleteTopicApi(workspaceId, meetingId, topicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      toast({ title: "Success", description: "Topic deleted." });
    },
  });
};

export const useFinalizeAgendaMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => finalizeAgendaApi(workspaceId, meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      toast({ title: "Agenda Finalized", description: "The agenda is now locked for modifications." });
    },
  });
};

export const useUpsertMinutesMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { summary?: string; decisions?: string[]; unresolvedIssues?: string[] }) =>
      upsertMinutesApi(workspaceId, meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      toast({ title: "Success", description: "Meeting minutes saved." });
    },
  });
};

export const useCreateActionItemMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createActionItemApi(workspaceId, meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      toast({ title: "Success", description: "Action item created." });
    },
  });
};

export const useUpdateActionItemMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actionItemId, data }: { actionItemId: string; data: Partial<IMeetingActionItem> }) =>
      updateActionItemApi(workspaceId, meetingId, actionItemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
    },
  });
};

export const useConvertActionItemToTaskMutation = (workspaceId: string, meetingId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actionItemId, data }: { actionItemId: string; data: any }) =>
      convertActionItemToTaskApi(workspaceId, meetingId, actionItemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(workspaceId, meetingId) });
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
      toast({ title: "Converted to Task", description: "Project task has been created successfully!" });
    },
    onError: (err: any) => {
      toast({
        title: "Conversion Failed",
        description: err.response?.data?.message || "Failed to convert action item to task",
        variant: "destructive",
      });
    },
  });
};
