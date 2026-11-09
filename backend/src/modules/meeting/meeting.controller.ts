import { Request, Response } from "express";
import { asyncHandler } from "../../common/middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import { getMemberRoleInWorkspace } from "../member/member.service";
import { roleGuard } from "../../common/utils/roleGuard";
import { Permissions } from "../../common/enums/association.enum";
import {
  actionItemIdSchema,
  addParticipantsSchema,
  attendanceSchema,
  cancelMeetingSchema,
  convertActionItemToTaskSchema,
  createActionItemSchema,
  createMeetingSchema,
  createTopicSchema,
  getMeetingsQuerySchema,
  meetingIdSchema,
  reorderTopicsSchema,
  rescheduleMeetingSchema,
  reviewTopicSchema,
  rsvpMeetingSchema,
  topicIdSchema,
  updateActionItemSchema,
  updateMeetingSchema,
  updateTopicSchema,
  upsertMinutesSchema,
} from "./meeting.validation";
import {
  addParticipantsService,
  cancelMeetingService,
  completeMeetingService,
  convertActionItemToTaskService,
  createActionItemService,
  createMeetingService,
  createTopicService,
  deleteTopicService,
  finalizeAgendaService,
  getAllMeetingsService,
  getCalendarMeetingsService,
  getMeetingActivitiesService,
  getMeetingByIdService,
  getMeetingStatsService,
  recordAttendanceService,
  removeParticipantService,
  reorderTopicsService,
  rescheduleMeetingService,
  resolveAudienceMembers,
  reviewTopicService,
  rsvpMeetingService,
  startMeetingService,
  updateActionItemService,
  updateMeetingService,
  updateTopicService,
  upsertMinutesService,
} from "./meeting.service";

// Create Meeting
export const createMeetingController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = req.params.workspaceId;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MEETING_CREATE]);

    const body = createMeetingSchema.parse(req.body);

    const { meeting } = await createMeetingService(workspaceId, userId, body);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Meeting scheduled successfully",
      meeting,
    });
  }
);

// Get All Meetings
export const getAllMeetingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = req.params.workspaceId;

    await getMemberRoleInWorkspace(userId, workspaceId);

    const query = getMeetingsQuerySchema.parse(req.query);

    const data = await getAllMeetingsService(workspaceId, userId, query);

    return res.status(HTTPSTATUS.OK).json({
      message: "Meetings retrieved successfully",
      ...data,
    });
  }
);

// Get Meeting Stats
export const getMeetingStatsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = req.params.workspaceId;

    await getMemberRoleInWorkspace(userId, workspaceId);

    const stats = await getMeetingStatsService(workspaceId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Meeting stats retrieved successfully",
      stats,
    });
  }
);

// Get Calendar Meetings
export const getCalendarMeetingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = req.params.workspaceId;

    await getMemberRoleInWorkspace(userId, workspaceId);

    const { start, end, filterType } = req.query as {
      start: string;
      end: string;
      filterType?: string;
    };

    const data = await getCalendarMeetingsService(
      workspaceId,
      userId,
      start || new Date().toISOString(),
      end || new Date().toISOString(),
      filterType
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Calendar meetings retrieved successfully",
      ...data,
    });
  }
);

// Resolve Audience Preview
export const resolveAudienceController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = req.params.workspaceId;

    await getMemberRoleInWorkspace(userId, workspaceId);

    const { audience, projectId, teamIds, customUserIds } = req.body;

    const memberIds = await resolveAudienceMembers(
      workspaceId,
      audience,
      projectId,
      teamIds,
      customUserIds
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Audience members resolved",
      memberIds,
      count: memberIds.length,
    });
  }
);

// Get Meeting Details by ID
export const getMeetingByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    await getMemberRoleInWorkspace(userId, workspaceId);
    meetingIdSchema.parse(meetingId);

    const data = await getMeetingByIdService(workspaceId, meetingId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Meeting retrieved successfully",
      ...data,
    });
  }
);

// Update Meeting
export const updateMeetingController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MEETING_UPDATE]);

    meetingIdSchema.parse(meetingId);
    const body = updateMeetingSchema.parse(req.body);

    const data = await updateMeetingService(
      workspaceId,
      meetingId,
      userId,
      role,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Meeting updated successfully",
      ...data,
    });
  }
);

// Reschedule Meeting
export const rescheduleMeetingController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MEETING_UPDATE]);

    meetingIdSchema.parse(meetingId);
    const body = rescheduleMeetingSchema.parse(req.body);

    const data = await rescheduleMeetingService(
      workspaceId,
      meetingId,
      userId,
      role,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Meeting rescheduled successfully",
      ...data,
    });
  }
);

// Cancel Meeting
export const cancelMeetingController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MEETING_CANCEL]);

    meetingIdSchema.parse(meetingId);
    const body = cancelMeetingSchema.parse(req.body);

    const data = await cancelMeetingService(
      workspaceId,
      meetingId,
      userId,
      role,
      body.cancelReason
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Meeting cancelled successfully",
      ...data,
    });
  }
);

// Start Meeting
export const startMeetingController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    meetingIdSchema.parse(meetingId);

    const data = await startMeetingService(workspaceId, meetingId, userId, role);

    return res.status(HTTPSTATUS.OK).json({
      message: "Meeting started successfully",
      ...data,
    });
  }
);

// Complete Meeting
export const completeMeetingController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    meetingIdSchema.parse(meetingId);

    const data = await completeMeetingService(
      workspaceId,
      meetingId,
      userId,
      role
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Meeting completed successfully",
      ...data,
    });
  }
);

// Add Participants
export const addParticipantsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MEETING_MANAGE_ATTENDEES]);

    meetingIdSchema.parse(meetingId);
    const body = addParticipantsSchema.parse(req.body);

    const data = await addParticipantsService(
      workspaceId,
      meetingId,
      userId,
      role,
      body.userIds,
      body.role
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Participants added successfully",
      ...data,
    });
  }
);

// Remove Participant
export const removeParticipantController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId, targetUserId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MEETING_MANAGE_ATTENDEES]);

    meetingIdSchema.parse(meetingId);

    const data = await removeParticipantService(
      workspaceId,
      meetingId,
      userId,
      role,
      targetUserId
    );

    return res.status(HTTPSTATUS.OK).json(data);
  }
);

// RSVP to Meeting
export const rsvpMeetingController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    meetingIdSchema.parse(meetingId);
    const body = rsvpMeetingSchema.parse(req.body);

    const data = await rsvpMeetingService(workspaceId, meetingId, userId, body);

    return res.status(HTTPSTATUS.OK).json({
      message: "RSVP updated successfully",
      ...data,
    });
  }
);

// Record Attendance (Join / Leave)
export const recordAttendanceController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    meetingIdSchema.parse(meetingId);
    const body = attendanceSchema.parse(req.body);

    const data = await recordAttendanceService(
      workspaceId,
      meetingId,
      userId,
      body.attendanceStatus
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Attendance recorded",
      ...data,
    });
  }
);

// Create Discussion Topic
export const createTopicController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MEETING_ADD_DISCUSSION_TOPIC]);

    meetingIdSchema.parse(meetingId);
    const body = createTopicSchema.parse(req.body);

    const data = await createTopicService(
      workspaceId,
      meetingId,
      userId,
      role,
      body
    );

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Topic created successfully",
      ...data,
    });
  }
);

// Update Topic
export const updateTopicController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId, topicId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    meetingIdSchema.parse(meetingId);
    topicIdSchema.parse(topicId);

    const body = updateTopicSchema.parse(req.body);

    const data = await updateTopicService(
      workspaceId,
      meetingId,
      topicId,
      userId,
      role,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Topic updated successfully",
      ...data,
    });
  }
);

// Review Topic (Approve / Reject)
export const reviewTopicController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId, topicId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MEETING_MANAGE_AGENDA]);

    meetingIdSchema.parse(meetingId);
    topicIdSchema.parse(topicId);

    const body = reviewTopicSchema.parse(req.body);

    const data = await reviewTopicService(
      workspaceId,
      meetingId,
      topicId,
      userId,
      role,
      body.status
    );

    return res.status(HTTPSTATUS.OK).json({
      message: `Topic ${body.status.toLowerCase()} successfully`,
      ...data,
    });
  }
);

// Delete Topic
export const deleteTopicController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId, topicId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    meetingIdSchema.parse(meetingId);
    topicIdSchema.parse(topicId);

    const data = await deleteTopicService(
      workspaceId,
      meetingId,
      topicId,
      userId,
      role
    );

    return res.status(HTTPSTATUS.OK).json(data);
  }
);

// Reorder Topics
export const reorderTopicsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MEETING_MANAGE_AGENDA]);

    meetingIdSchema.parse(meetingId);
    const body = reorderTopicsSchema.parse(req.body);

    const data = await reorderTopicsService(
      workspaceId,
      meetingId,
      userId,
      role,
      body.topicIds
    );

    return res.status(HTTPSTATUS.OK).json(data);
  }
);

// Finalize Agenda
export const finalizeAgendaController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MEETING_MANAGE_AGENDA]);

    meetingIdSchema.parse(meetingId);

    const data = await finalizeAgendaService(
      workspaceId,
      meetingId,
      userId,
      role
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Agenda finalized successfully",
      ...data,
    });
  }
);

// Upsert Minutes
export const upsertMinutesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MEETING_MANAGE_MINUTES]);

    meetingIdSchema.parse(meetingId);
    const body = upsertMinutesSchema.parse(req.body);

    const data = await upsertMinutesService(
      workspaceId,
      meetingId,
      userId,
      role,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Meeting minutes saved successfully",
      ...data,
    });
  }
);

// Create Action Item
export const createActionItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MEETING_MANAGE_ACTION_ITEMS]);

    meetingIdSchema.parse(meetingId);
    const body = createActionItemSchema.parse(req.body);

    const data = await createActionItemService(
      workspaceId,
      meetingId,
      userId,
      role,
      body
    );

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Action item created successfully",
      ...data,
    });
  }
);

// Update Action Item
export const updateActionItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId, actionItemId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MEETING_MANAGE_ACTION_ITEMS]);

    meetingIdSchema.parse(meetingId);
    actionItemIdSchema.parse(actionItemId);
    const body = updateActionItemSchema.parse(req.body);

    const data = await updateActionItemService(
      workspaceId,
      meetingId,
      actionItemId,
      userId,
      role,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Action item updated successfully",
      ...data,
    });
  }
);

// Convert Action Item to Project Task
export const convertActionItemToTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId, actionItemId } = req.params;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.MEETING_MANAGE_ACTION_ITEMS]);

    meetingIdSchema.parse(meetingId);
    actionItemIdSchema.parse(actionItemId);
    const body = convertActionItemToTaskSchema.parse(req.body);

    const data = await convertActionItemToTaskService(
      workspaceId,
      meetingId,
      actionItemId,
      userId,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Action item converted to project task successfully",
      ...data,
    });
  }
);

// Get Activities
export const getMeetingActivitiesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaceId, meetingId } = req.params;

    await getMemberRoleInWorkspace(userId, workspaceId);
    meetingIdSchema.parse(meetingId);

    const data = await getMeetingActivitiesService(workspaceId, meetingId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Activities retrieved successfully",
      ...data,
    });
  }
);

