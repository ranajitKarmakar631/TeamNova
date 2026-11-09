import { Router } from "express";
import {
  addParticipantsController,
  cancelMeetingController,
  completeMeetingController,
  convertActionItemToTaskController,
  createActionItemController,
  createMeetingController,
  createTopicController,
  deleteTopicController,
  finalizeAgendaController,
  getAllMeetingsController,
  getCalendarMeetingsController,
  getMeetingActivitiesController,
  getMeetingByIdController,
  getMeetingStatsController,
  recordAttendanceController,
  removeParticipantController,
  reorderTopicsController,
  rescheduleMeetingController,
  resolveAudienceController,
  reviewTopicController,
  rsvpMeetingController,
  startMeetingController,
  updateActionItemController,
  updateMeetingController,
  updateTopicController,
  upsertMinutesController,
} from "./meeting.controller";

const meetingRoutes = Router();

// General & Workspace Queries
meetingRoutes.post("/:workspaceId", createMeetingController);
meetingRoutes.get("/:workspaceId", getAllMeetingsController);
meetingRoutes.get("/:workspaceId/stats", getMeetingStatsController);
meetingRoutes.get("/:workspaceId/calendar", getCalendarMeetingsController);
meetingRoutes.post("/:workspaceId/resolve-audience", resolveAudienceController);

// Single Meeting Operations
meetingRoutes.get("/:workspaceId/:meetingId", getMeetingByIdController);
meetingRoutes.patch("/:workspaceId/:meetingId", updateMeetingController);
meetingRoutes.patch("/:workspaceId/:meetingId/reschedule", rescheduleMeetingController);
meetingRoutes.patch("/:workspaceId/:meetingId/cancel", cancelMeetingController);
meetingRoutes.patch("/:workspaceId/:meetingId/start", startMeetingController);
meetingRoutes.patch("/:workspaceId/:meetingId/complete", completeMeetingController);

// Participants
meetingRoutes.post("/:workspaceId/:meetingId/participants", addParticipantsController);
meetingRoutes.delete("/:workspaceId/:meetingId/participants/:targetUserId", removeParticipantController);
meetingRoutes.patch("/:workspaceId/:meetingId/rsvp", rsvpMeetingController);
meetingRoutes.patch("/:workspaceId/:meetingId/attendance", recordAttendanceController);

// Discussion Topics & Agenda
meetingRoutes.post("/:workspaceId/:meetingId/topics", createTopicController);
meetingRoutes.patch("/:workspaceId/:meetingId/topics/reorder", reorderTopicsController);
meetingRoutes.patch("/:workspaceId/:meetingId/finalize-agenda", finalizeAgendaController);
meetingRoutes.patch("/:workspaceId/:meetingId/topics/:topicId", updateTopicController);
meetingRoutes.patch("/:workspaceId/:meetingId/topics/:topicId/review", reviewTopicController);
meetingRoutes.delete("/:workspaceId/:meetingId/topics/:topicId", deleteTopicController);

// Meeting Minutes
meetingRoutes.put("/:workspaceId/:meetingId/minutes", upsertMinutesController);

// Action Items
meetingRoutes.post("/:workspaceId/:meetingId/action-items", createActionItemController);
meetingRoutes.patch("/:workspaceId/:meetingId/action-items/:actionItemId", updateActionItemController);
meetingRoutes.post(
  "/:workspaceId/:meetingId/action-items/:actionItemId/convert-to-task",
  convertActionItemToTaskController
);

// Activities
meetingRoutes.get("/:workspaceId/:meetingId/activities", getMeetingActivitiesController);

export { meetingRoutes };

