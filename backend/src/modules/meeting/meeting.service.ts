import mongoose from "mongoose";
import MeetingModel, { MeetingDocument } from "./meeting.model";
import MeetingParticipantModel, {
  MeetingParticipantDocument,
} from "./meeting-participant.model";
import MeetingTopicModel, { MeetingTopicDocument } from "./meeting-topic.model";
import MeetingMinutesModel, {
  MeetingMinutesDocument,
} from "./meeting-minutes.model";
import MeetingActionItemModel, {
  MeetingActionItemDocument,
} from "./meeting-action-item.model";
import MeetingActivityModel from "./meeting-activity.model";
import MemberModel from "../member/member.model";
import ProjectModel from "../project/project.model";
import TeamModel from "../teams/teams.model";
import TaskModel from "../task/task.model";
import UserModel from "../user/user.model";
import AssociationModel, {
  AssociationStatus,
} from "../association/association.model";
import {
  ActionItemPriority,
  ActionItemStatus,
  AttendanceStatus,
  InvitationStatus,
  InvitationStatusType,
  MeetingActivityAction,
  MeetingAudience,
  MeetingStatus,
  ParticipantRole,
  ParticipantRoleType,
  TopicPriority,
  TopicSource,
  TopicStatus,
} from "./meeting.enum";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../../common/utils/appError";
import {
  cancelMeetingReminderJobs,
  scheduleMeetingReminders,
} from "./meeting.queue";
import {
  notificationService,
  NotificationPriorityEnum,
  NotificationTypeEnum,
} from "../notification";
import {
  AssociationScope,
  WorkspaceRoles,
} from "../../common/enums/association.enum";
import { getMemberRoleInWorkspace } from "../member/member.service";
import { getIO } from "../chats/socket/socket.instance";

// ==========================================
// AUDIENCE RESOLVER
// ==========================================
export const resolveAudienceMembers = async (
  workspaceId: string,
  audience: string,
  projectId?: string | null,
  teamIds: string[] = [],
  customUserIds: string[] = []
): Promise<string[]> => {
  const resolvedUserIds = new Set<string>();

  switch (audience) {
    case MeetingAudience.WORKSPACE: {
      const members = await MemberModel.find({ workspaceId }).select("userId");
      members.forEach((m) => {
        if (m.userId) resolvedUserIds.add(m.userId.toString());
      });
      break;
    }

    case MeetingAudience.PROJECT: {
      if (!projectId) {
        throw new BadRequestException("Project ID is required for Project audience");
      }
      const project = await ProjectModel.findOne({
        _id: projectId,
        workspace: workspaceId,
      }).select("createdBy");
      if (project && project.createdBy) {
        resolvedUserIds.add(project.createdBy.toString());
      }

      const associations = await AssociationModel.find({
        workspaceId,
        scopeType: AssociationScope.PROJECT,
        scopeId: projectId,
        status: AssociationStatus.ACTIVE,
      }).populate({ path: "memberId", select: "userId" });

      associations.forEach((assoc: any) => {
        const uId = assoc.memberId?.userId?.toString();
        if (uId) resolvedUserIds.add(uId);
      });
      break;
    }

    case MeetingAudience.TEAM: {
      const teamId = teamIds[0];
      if (!teamId) {
        throw new BadRequestException("Team ID is required for Team audience");
      }
      const team = await TeamModel.findOne({
        _id: teamId,
        workspaceId,
      }).select("createdBy");
      if (team && team.createdBy) {
        resolvedUserIds.add(team.createdBy.toString());
      }

      const teamAssocs = await AssociationModel.find({
        workspaceId,
        scopeType: AssociationScope.TEAM,
        scopeId: teamId,
        status: AssociationStatus.ACTIVE,
      }).populate({ path: "memberId", select: "userId" });

      teamAssocs.forEach((assoc: any) => {
        const uId = assoc.memberId?.userId?.toString();
        if (uId) resolvedUserIds.add(uId);
      });
      break;
    }

    case MeetingAudience.MULTIPLE_TEAMS: {
      if (!teamIds || teamIds.length === 0) {
        throw new BadRequestException("At least one team must be selected");
      }
      const teams = await TeamModel.find({
        _id: { $in: teamIds },
        workspaceId,
      }).select("createdBy");
      teams.forEach((t) => {
        if (t.createdBy) resolvedUserIds.add(t.createdBy.toString());
      });

      const multiAssocs = await AssociationModel.find({
        workspaceId,
        scopeType: AssociationScope.TEAM,
        scopeId: { $in: teamIds },
        status: AssociationStatus.ACTIVE,
      }).populate({ path: "memberId", select: "userId" });

      multiAssocs.forEach((assoc: any) => {
        const uId = assoc.memberId?.userId?.toString();
        if (uId) resolvedUserIds.add(uId);
      });
      break;
    }

    case MeetingAudience.CUSTOM:
    case MeetingAudience.INDIVIDUAL: {
      if (customUserIds && customUserIds.length > 0) {
        // Validate each user is actually a member of this workspace
        const validMembers = await MemberModel.find({
          workspaceId,
          userId: { $in: customUserIds },
        }).select("userId");
        validMembers.forEach((m) => {
          if (m.userId) resolvedUserIds.add(m.userId.toString());
        });
      }
      break;
    }

    default:
      break;
  }

  return Array.from(resolvedUserIds);
};

// ==========================================
// ACTIVITY LOGGER
// ==========================================
export const logMeetingActivity = async (
  workspaceId: any,
  meetingId: any,
  actorId: any,
  action: string,
  entityType?: string,
  entityId?: any,
  metadata?: Record<string, any>
) => {
  try {
    await MeetingActivityModel.create({
      workspaceId,
      meetingId,
      actorId,
      action,
      entityType: entityType || "",
      entityId: entityId ? new mongoose.Types.ObjectId(entityId.toString()) : null,
      metadata: metadata || {},
    });
  } catch (err) {
    console.warn("[Meeting Activity] Failed to log activity:", err);
  }
};

// ==========================================
// MEETING MANAGEMENT HELPER (Organizer / Co-organizer / Admin)
// ==========================================
export const canUserManageMeeting = (
  meeting: MeetingDocument,
  userId: string,
  workspaceRole: string
): boolean => {
  if (
    workspaceRole === WorkspaceRoles.OWNER ||
    workspaceRole === WorkspaceRoles.ADMIN ||
    workspaceRole === WorkspaceRoles.MANAGER
  ) {
    return true;
  }
  if (meeting.organizerId.toString() === userId.toString()) {
    return true;
  }
  if (
    meeting.coOrganizerIds &&
    meeting.coOrganizerIds.some((id) => id.toString() === userId.toString())
  ) {
    return true;
  }
  return false;
};

// ==========================================
// CREATE MEETING SERVICE
// ==========================================
export const createMeetingService = async (
  workspaceId: string,
  userId: string,
  body: {
    title: string;
    description?: string;
    audience?: string;
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
      priority?: string;
      assignedTo?: string | null;
    }>;
    reminderSettings?: {
      dailyReminder?: boolean;
      fifteenMinutesBefore?: boolean;
      fiveMinutesBefore?: boolean;
      meetingStartNotification?: boolean;
    };
    agendaSubmissionDeadline?: string | Date | null;
    attachments?: Array<{ name: string; url: string; type?: string; size?: number }>;
  }
) => {
  const startAt = new Date(body.startAt);
  const endAt = new Date(body.endAt);

  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
    throw new BadRequestException("Invalid meeting start or end date");
  }
  if (startAt >= endAt) {
    throw new BadRequestException("Meeting end time must be after start time");
  }

  const audience = body.audience || MeetingAudience.WORKSPACE;

  // Resolve audience participants
  const resolvedUserIds = await resolveAudienceMembers(
    workspaceId,
    audience,
    body.projectId,
    body.teamIds || [],
    body.participantUserIds || []
  );

  // Ensure organizer is included in the resolved set
  const coOrganizerSet = new Set(body.coOrganizerIds || []);
  const allParticipantIds = new Set<string>([...resolvedUserIds, ...coOrganizerSet]);
  allParticipantIds.add(userId);

  // Create Meeting document
  const meeting = new MeetingModel({
    workspaceId,
    organizerId: userId,
    coOrganizerIds: (body.coOrganizerIds || []).map((id) => new mongoose.Types.ObjectId(id)),
    title: body.title.trim(),
    description: body.description || "",
    audience,
    projectId: body.projectId ? new mongoose.Types.ObjectId(body.projectId) : null,
    teamIds: (body.teamIds || []).map((id) => new mongoose.Types.ObjectId(id)),
    startAt,
    endAt,
    timezone: body.timezone || "UTC",
    meetingLink: body.meetingLink || "",
    meetingProvider: body.meetingProvider || "GOOGLE_MEET",
    status: MeetingStatus.SCHEDULED,
    reminderSettings: body.reminderSettings || {
      dailyReminder: true,
      fifteenMinutesBefore: true,
      fiveMinutesBefore: true,
      meetingStartNotification: true,
    },
    agendaSubmissionDeadline: body.agendaSubmissionDeadline
      ? new Date(body.agendaSubmissionDeadline)
      : null,
    scheduleVersion: 1,
    attachments: body.attachments || [],
  });

  await meeting.save();

  // Create Participant documents
  const participantDocs = Array.from(allParticipantIds).map((pUserId) => {
    const isOrganizer = pUserId === userId;
    const isCoOrganizer = coOrganizerSet.has(pUserId);

    let role: ParticipantRoleType = ParticipantRole.PARTICIPANT;
    let invitationStatus: InvitationStatusType = InvitationStatus.PENDING;
    let respondedAt: Date | null = null;

    if (isOrganizer) {
      role = ParticipantRole.ORGANIZER;
      invitationStatus = InvitationStatus.ACCEPTED;
      respondedAt = new Date();
    } else if (isCoOrganizer) {
      role = ParticipantRole.CO_ORGANIZER;
    }

    return {
      meetingId: meeting._id,
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      userId: new mongoose.Types.ObjectId(pUserId),
      role,
      invitationStatus,
      attendanceStatus: AttendanceStatus.NOT_JOINED,
      invitedBy: new mongoose.Types.ObjectId(userId),
      invitedAt: new Date(),
      respondedAt,
    };
  });

  if (participantDocs.length > 0) {
    try {
      await MeetingParticipantModel.insertMany(participantDocs, { ordered: false });
    } catch (insertErr: any) {
      // Ignore duplicate key errors if any race condition occurs
    }
  }

  // Create Initial Discussion Topics if provided
  if (body.topics && body.topics.length > 0) {
    const topicDocs = body.topics.map((t, idx) => ({
      meetingId: meeting._id,
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      title: t.title.trim(),
      description: t.description || "",
      createdBy: new mongoose.Types.ObjectId(userId),
      assignedTo: t.assignedTo ? new mongoose.Types.ObjectId(t.assignedTo) : null,
      source: TopicSource.ORGANIZER,
      priority: (t.priority as any) || TopicPriority.MEDIUM,
      status: TopicStatus.APPROVED,
      order: idx,
      reviewedBy: new mongoose.Types.ObjectId(userId),
      reviewedAt: new Date(),
    }));
    await MeetingTopicModel.insertMany(topicDocs);
  }

  // Log Activity
  await logMeetingActivity(
    workspaceId,
    meeting._id,
    userId,
    MeetingActivityAction.MEETING_CREATED,
    "Meeting",
    meeting._id,
    { title: meeting.title, audience: meeting.audience, startAt: meeting.startAt }
  );

  // Schedule BullMQ Reminders
  await scheduleMeetingReminders(meeting);

  // Dispatch Invitation Notifications to invited participants (excluding organizer)
  const inviteeIds = Array.from(allParticipantIds).filter((id) => id !== userId);
  if (inviteeIds.length > 0) {
    try {
      await notificationService.queueBulkNotifications({
        recipients: inviteeIds,
        sender: userId,
        workspaceId,
        type: NotificationTypeEnum.MEETING_INVITE,
        title: `Meeting Invitation: ${meeting.title}`,
        message: `You have been invited to "${meeting.title}" scheduled for ${startAt.toLocaleDateString()} at ${startAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${meeting.timezone}).`,
        data: {
          meetingId: meeting._id.toString(),
          meetingLink: meeting.meetingLink,
        },
        priority: NotificationPriorityEnum.HIGH,
        sendEmail: true,
      });
    } catch (err: any) {
      console.warn("[Meeting Service] Failed to send meeting invite notifications:", err.message);
    }
  }

  // Emit Socket Event
  try {
    const io = getIO();
    if (io) {
      io.to(`workspace:${workspaceId}`).emit("meeting:created", {
        meetingId: meeting._id.toString(),
        title: meeting.title,
        startAt: meeting.startAt,
        organizerId: userId,
      });
    }
  } catch (err) {
    // Socket emit error is non-fatal
  }

  return { meeting };
};

// ==========================================
// GET ALL MEETINGS SERVICE
// ==========================================
export const getAllMeetingsService = async (
  workspaceId: string,
  userId: string,
  query: {
    page?: number;
    limit?: number;
    status?: string;
    audience?: string;
    projectId?: string;
    teamId?: string;
    myMeetings?: boolean;
    search?: string;
    from?: string;
    to?: string;
  }
) => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.audience) {
    filter.audience = query.audience;
  }

  if (query.projectId) {
    filter.projectId = new mongoose.Types.ObjectId(query.projectId);
  }

  if (query.teamId) {
    filter.teamIds = new mongoose.Types.ObjectId(query.teamId);
  }

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.from || query.to) {
    filter.startAt = {};
    if (query.from) {
      filter.startAt.$gte = new Date(query.from);
    }
    if (query.to) {
      filter.startAt.$lte = new Date(query.to);
    }
  }

  // If filtering for "My Meetings", find meetings where user is organizer or participant
  if (query.myMeetings) {
    const userParticipations = await MeetingParticipantModel.find({
      workspaceId,
      userId,
    }).select("meetingId");
    const meetingIds = userParticipations.map((p) => p.meetingId);

    filter.$or = [
      { organizerId: new mongoose.Types.ObjectId(userId) },
      { _id: { $in: meetingIds } },
    ];
  }

  const [meetings, totalCount] = await Promise.all([
    MeetingModel.find(filter)
      .populate("organizerId", "name email profilePicture")
      .populate("projectId", "name emoji")
      .populate("teamIds", "name")
      .sort({ startAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MeetingModel.countDocuments(filter),
  ]);

  // Attach participant summary (avatars and count) to each meeting
  const meetingIds = meetings.map((m) => m._id);
  const participants = await MeetingParticipantModel.find({
    meetingId: { $in: meetingIds },
  })
    .populate("userId", "name email profilePicture")
    .lean();

  const participantMap = new Map<string, any[]>();
  participants.forEach((p) => {
    const mId = p.meetingId.toString();
    if (!participantMap.has(mId)) {
      participantMap.set(mId, []);
    }
    participantMap.get(mId)!.push(p);
  });

  const enrichedMeetings = meetings.map((m) => {
    const parts = participantMap.get(m._id.toString()) || [];
    return {
      ...m,
      participantCount: parts.length,
      participants: parts.slice(0, 5),
    };
  });

  return {
    meetings: enrichedMeetings,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    page,
    limit,
  };
};

// ==========================================
// GET MEETING STATS SERVICE
// ==========================================
export const getMeetingStatsService = async (
  workspaceId: string,
  userId: string
) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const wsObjectId = new mongoose.Types.ObjectId(workspaceId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // User's participant meeting IDs
  const userParticipations = await MeetingParticipantModel.find({
    workspaceId: wsObjectId,
    userId: userObjectId,
  }).select("meetingId");
  const userMeetingIds = userParticipations.map((p) => p.meetingId);

  const [upcoming, thisWeek, myMeetings, past] = await Promise.all([
    // Upcoming: startAt >= now, not cancelled
    MeetingModel.countDocuments({
      workspaceId: wsObjectId,
      startAt: { $gte: now },
      status: { $in: [MeetingStatus.SCHEDULED, MeetingStatus.IN_PROGRESS] },
    }),
    // This week: startAt between startOfWeek and endOfWeek
    MeetingModel.countDocuments({
      workspaceId: wsObjectId,
      startAt: { $gte: startOfWeek, $lt: endOfWeek },
      status: { $ne: MeetingStatus.CANCELLED },
    }),
    // My meetings: user is organizer or participant
    MeetingModel.countDocuments({
      workspaceId: wsObjectId,
      $or: [
        { organizerId: userObjectId },
        { _id: { $in: userMeetingIds } },
      ],
      status: { $ne: MeetingStatus.CANCELLED },
    }),
    // Past: endAt < now or status COMPLETED
    MeetingModel.countDocuments({
      workspaceId: wsObjectId,
      $or: [
        { endAt: { $lt: now } },
        { status: MeetingStatus.COMPLETED },
      ],
    }),
  ]);

  return {
    upcoming,
    thisWeek,
    myMeetings,
    past,
  };
};

// ==========================================
// GET CALENDAR MEETINGS SERVICE
// ==========================================
export const getCalendarMeetingsService = async (
  workspaceId: string,
  userId: string,
  startDateStr: string,
  endDateStr: string,
  filterType?: string
) => {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const filter: Record<string, any> = {
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    startAt: { $gte: startDate, $lte: endDate },
    status: { $ne: MeetingStatus.CANCELLED },
  };

  if (filterType === "my-meetings") {
    const userParticipations = await MeetingParticipantModel.find({
      workspaceId,
      userId,
    }).select("meetingId");
    const mIds = userParticipations.map((p) => p.meetingId);
    filter.$or = [
      { organizerId: new mongoose.Types.ObjectId(userId) },
      { _id: { $in: mIds } },
    ];
  } else if (filterType === "team-meetings") {
    filter.audience = { $in: [MeetingAudience.TEAM, MeetingAudience.MULTIPLE_TEAMS] };
  } else if (filterType === "project-meetings") {
    filter.audience = MeetingAudience.PROJECT;
  } else if (filterType === "workspace-meetings") {
    filter.audience = MeetingAudience.WORKSPACE;
  }

  const meetings = await MeetingModel.find(filter)
    .populate("organizerId", "name email profilePicture")
    .populate("projectId", "name emoji")
    .populate("teamIds", "name")
    .sort({ startAt: 1 })
    .lean();

  return { meetings };
};

// ==========================================
// GET SINGLE MEETING DETAILS SERVICE
// ==========================================
export const getMeetingByIdService = async (
  workspaceId: string,
  meetingId: string,
  userId: string
) => {
  const meeting = await MeetingModel.findOne({
    _id: meetingId,
    workspaceId,
  })
    .populate("organizerId", "name email profilePicture")
    .populate("coOrganizerIds", "name email profilePicture")
    .populate("projectId", "name emoji")
    .populate("teamIds", "name")
    .lean();

  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  const [participants, topics, minutes, actionItems] = await Promise.all([
    MeetingParticipantModel.find({ meetingId })
      .populate("userId", "name email profilePicture")
      .sort({ createdAt: 1 })
      .lean(),
    MeetingTopicModel.find({ meetingId })
      .populate("createdBy", "name email profilePicture")
      .populate("assignedTo", "name email profilePicture")
      .sort({ order: 1, createdAt: 1 })
      .lean(),
    MeetingMinutesModel.findOne({ meetingId })
      .populate("recordedBy", "name email profilePicture")
      .populate("updatedBy", "name email profilePicture")
      .lean(),
    MeetingActionItemModel.find({ meetingId })
      .populate("assignedTo", "name email profilePicture")
      .populate("createdBy", "name email profilePicture")
      .populate("linkedTaskId", "title status priority")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const currentParticipant = participants.find(
    (p) => p.userId && (p.userId as any)._id?.toString() === userId.toString()
  );

  return {
    meeting,
    participants,
    topics,
    minutes: minutes || null,
    actionItems,
    currentParticipant: currentParticipant || null,
  };
};

// ==========================================
// UPDATE MEETING SERVICE
// ==========================================
export const updateMeetingService = async (
  workspaceId: string,
  meetingId: string,
  userId: string,
  userRole: string,
  body: {
    title?: string;
    description?: string;
    meetingLink?: string;
    meetingProvider?: string;
    reminderSettings?: any;
    agendaSubmissionDeadline?: string | Date | null;
    attachments?: any[];
  }
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  if (!canUserManageMeeting(meeting, userId, userRole)) {
    throw new UnauthorizedException("You are not authorized to edit this meeting");
  }

  if (body.title) meeting.title = body.title.trim();
  if (body.description !== undefined) meeting.description = body.description;
  if (body.meetingLink !== undefined) meeting.meetingLink = body.meetingLink;
  if (body.meetingProvider) meeting.meetingProvider = body.meetingProvider;
  if (body.reminderSettings) {
    meeting.reminderSettings = { ...meeting.reminderSettings, ...body.reminderSettings };
  }
  if (body.agendaSubmissionDeadline !== undefined) {
    meeting.agendaSubmissionDeadline = body.agendaSubmissionDeadline
      ? new Date(body.agendaSubmissionDeadline)
      : null;
  }
  if (body.attachments) meeting.attachments = body.attachments;

  await meeting.save();

  await logMeetingActivity(
    workspaceId,
    meeting._id,
    userId,
    MeetingActivityAction.MEETING_UPDATED,
    "Meeting",
    meeting._id,
    { title: meeting.title }
  );

  return { meeting };
};

// ==========================================
// RESCHEDULE MEETING SERVICE
// ==========================================
export const rescheduleMeetingService = async (
  workspaceId: string,
  meetingId: string,
  userId: string,
  userRole: string,
  body: {
    startAt: string | Date;
    endAt: string | Date;
    timezone?: string;
  }
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  if (!canUserManageMeeting(meeting, userId, userRole)) {
    throw new UnauthorizedException("You are not authorized to reschedule this meeting");
  }

  if (meeting.status === MeetingStatus.CANCELLED || meeting.status === MeetingStatus.COMPLETED) {
    throw new BadRequestException("Cannot reschedule a cancelled or completed meeting");
  }

  const startAt = new Date(body.startAt);
  const endAt = new Date(body.endAt);

  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
    throw new BadRequestException("Invalid meeting dates");
  }
  if (startAt >= endAt) {
    throw new BadRequestException("Meeting end time must be after start time");
  }

  // Cancel prior reminder jobs
  await cancelMeetingReminderJobs(meeting._id.toString(), meeting.scheduleVersion);

  meeting.startAt = startAt;
  meeting.endAt = endAt;
  if (body.timezone) meeting.timezone = body.timezone;
  meeting.scheduleVersion += 1;
  meeting.status = MeetingStatus.SCHEDULED; // Return to scheduled if previously in progress
  await meeting.save();

  // Schedule new reminder jobs
  await scheduleMeetingReminders(meeting);

  // Log Activity
  await logMeetingActivity(
    workspaceId,
    meeting._id,
    userId,
    MeetingActivityAction.MEETING_RESCHEDULED,
    "Meeting",
    meeting._id,
    { startAt, endAt, scheduleVersion: meeting.scheduleVersion }
  );

  // Notify participants
  const participants = await MeetingParticipantModel.find({
    meetingId: meeting._id,
    invitationStatus: { $ne: InvitationStatus.DECLINED },
  }).select("userId");
  const recipientIds = participants
    .map((p) => p.userId.toString())
    .filter((id) => id !== userId);

  if (recipientIds.length > 0) {
    try {
      await notificationService.queueBulkNotifications({
        recipients: recipientIds,
        sender: userId,
        workspaceId,
        type: NotificationTypeEnum.MEETING_RESCHEDULED,
        title: `Meeting Rescheduled: ${meeting.title}`,
        message: `"${meeting.title}" has been rescheduled to ${startAt.toLocaleDateString()} at ${startAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${meeting.timezone}).`,
        data: {
          meetingId: meeting._id.toString(),
          meetingLink: meeting.meetingLink,
          startAt,
        },
        priority: NotificationPriorityEnum.HIGH,
        sendEmail: true,
      });
    } catch (err: any) {
      console.warn("[Meeting Service] Failed to notify on reschedule:", err.message);
    }
  }

  return { meeting };
};

// ==========================================
// CANCEL MEETING SERVICE
// ==========================================
export const cancelMeetingService = async (
  workspaceId: string,
  meetingId: string,
  userId: string,
  userRole: string,
  cancelReason?: string
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  if (!canUserManageMeeting(meeting, userId, userRole)) {
    throw new UnauthorizedException("You are not authorized to cancel this meeting");
  }

  if (meeting.status === MeetingStatus.CANCELLED) {
    throw new BadRequestException("Meeting is already cancelled");
  }

  // Cancel pending BullMQ reminder jobs
  await cancelMeetingReminderJobs(meeting._id.toString(), meeting.scheduleVersion);

  meeting.status = MeetingStatus.CANCELLED;
  meeting.cancelledAt = new Date();
  meeting.cancelledBy = new mongoose.Types.ObjectId(userId);
  meeting.cancelReason = cancelReason || "Meeting cancelled by organizer";
  await meeting.save();

  // Log Activity
  await logMeetingActivity(
    workspaceId,
    meeting._id,
    userId,
    MeetingActivityAction.MEETING_CANCELLED,
    "Meeting",
    meeting._id,
    { cancelReason: meeting.cancelReason }
  );

  // Notify participants
  const participants = await MeetingParticipantModel.find({
    meetingId: meeting._id,
    invitationStatus: { $ne: InvitationStatus.DECLINED },
  }).select("userId");
  const recipientIds = participants
    .map((p) => p.userId.toString())
    .filter((id) => id !== userId);

  if (recipientIds.length > 0) {
    try {
      await notificationService.queueBulkNotifications({
        recipients: recipientIds,
        sender: userId,
        workspaceId,
        type: NotificationTypeEnum.MEETING_CANCELLED,
        title: `Meeting Cancelled: ${meeting.title}`,
        message: `"${meeting.title}" has been cancelled. Reason: ${meeting.cancelReason}`,
        data: {
          meetingId: meeting._id.toString(),
        },
        priority: NotificationPriorityEnum.HIGH,
        sendEmail: true,
      });
    } catch (err: any) {
      console.warn("[Meeting Service] Failed to notify cancellation:", err.message);
    }
  }

  return { meeting };
};

// ==========================================
// START MEETING SERVICE
// ==========================================
export const startMeetingService = async (
  workspaceId: string,
  meetingId: string,
  userId: string,
  userRole: string
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  if (!canUserManageMeeting(meeting, userId, userRole)) {
    throw new UnauthorizedException("You are not authorized to start this meeting");
  }

  if (meeting.status === MeetingStatus.CANCELLED) {
    throw new BadRequestException("Cannot start a cancelled meeting");
  }
  if (meeting.status === MeetingStatus.COMPLETED) {
    throw new BadRequestException("Cannot start a completed meeting");
  }

  meeting.status = MeetingStatus.IN_PROGRESS;
  await meeting.save();

  await logMeetingActivity(
    workspaceId,
    meeting._id,
    userId,
    MeetingActivityAction.MEETING_STARTED,
    "Meeting",
    meeting._id
  );

  return { meeting };
};

// ==========================================
// COMPLETE MEETING SERVICE
// ==========================================
export const completeMeetingService = async (
  workspaceId: string,
  meetingId: string,
  userId: string,
  userRole: string
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  if (!canUserManageMeeting(meeting, userId, userRole)) {
    throw new UnauthorizedException("You are not authorized to complete this meeting");
  }

  meeting.status = MeetingStatus.COMPLETED;
  meeting.completedAt = new Date();
  await meeting.save();

  await cancelMeetingReminderJobs(meeting._id.toString(), meeting.scheduleVersion);

  await logMeetingActivity(
    workspaceId,
    meeting._id,
    userId,
    MeetingActivityAction.MEETING_COMPLETED,
    "Meeting",
    meeting._id
  );

  return { meeting };
};

// ==========================================
// PARTICIPANT SERVICES
// ==========================================
export const addParticipantsService = async (
  workspaceId: string,
  meetingId: string,
  actorUserId: string,
  userRole: string,
  userIds: string[],
  role: string = ParticipantRole.PARTICIPANT
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  if (!canUserManageMeeting(meeting, actorUserId, userRole)) {
    throw new UnauthorizedException("You are not authorized to add participants");
  }

  // Validate users exist in workspace
  const validMembers = await MemberModel.find({
    workspaceId,
    userId: { $in: userIds },
  }).select("userId");
  const validUserIds = validMembers.map((m) => m.userId.toString());

  const docsToInsert = validUserIds.map((uId) => ({
    meetingId: meeting._id,
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    userId: new mongoose.Types.ObjectId(uId),
    role: (role as any) || ParticipantRole.PARTICIPANT,
    invitationStatus: InvitationStatus.PENDING,
    attendanceStatus: AttendanceStatus.NOT_JOINED,
    invitedBy: new mongoose.Types.ObjectId(actorUserId),
    invitedAt: new Date(),
  }));

  try {
    await MeetingParticipantModel.insertMany(docsToInsert, { ordered: false });
  } catch (err) {
    // Ignore duplicate entries
  }

  // Log activity
  await logMeetingActivity(
    workspaceId,
    meeting._id,
    actorUserId,
    MeetingActivityAction.PARTICIPANT_INVITED,
    "Participant",
    null,
    { count: validUserIds.length }
  );

  // Send invitation notifications to newly added users
  if (validUserIds.length > 0) {
    try {
      await notificationService.queueBulkNotifications({
        recipients: validUserIds,
        sender: actorUserId,
        workspaceId,
        type: NotificationTypeEnum.MEETING_INVITE,
        title: `Meeting Invitation: ${meeting.title}`,
        message: `You have been added to "${meeting.title}" scheduled for ${new Date(
          meeting.startAt
        ).toLocaleDateString()} at ${new Date(meeting.startAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}.`,
        data: {
          meetingId: meeting._id.toString(),
          meetingLink: meeting.meetingLink,
        },
        priority: NotificationPriorityEnum.HIGH,
        sendEmail: true,
      });
    } catch (err: any) {
      console.warn("[Meeting Service] Failed to notify added participants:", err.message);
    }
  }

  const updatedParticipants = await MeetingParticipantModel.find({ meetingId: meeting._id })
    .populate("userId", "name email profilePicture")
    .lean();

  return { participants: updatedParticipants };
};

export const removeParticipantService = async (
  workspaceId: string,
  meetingId: string,
  actorUserId: string,
  userRole: string,
  targetUserId: string
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  if (!canUserManageMeeting(meeting, actorUserId, userRole)) {
    throw new UnauthorizedException("You are not authorized to remove participants");
  }

  if (meeting.organizerId.toString() === targetUserId.toString()) {
    throw new BadRequestException("Cannot remove the meeting organizer");
  }

  await MeetingParticipantModel.findOneAndDelete({
    meetingId: meeting._id,
    userId: targetUserId,
  });

  return { message: "Participant removed successfully" };
};

export const rsvpMeetingService = async (
  workspaceId: string,
  meetingId: string,
  userId: string,
  body: {
    status: string;
    declineReason?: string | null;
  }
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  let participant = await MeetingParticipantModel.findOne({
    meetingId: meeting._id,
    userId,
  });

  if (!participant) {
    // If user is a member of this workspace, allow them to RSVP / join
    const member = await MemberModel.findOne({ workspaceId, userId });
    if (!member) {
      throw new UnauthorizedException("You are not a member of this workspace");
    }

    participant = new MeetingParticipantModel({
      meetingId: meeting._id,
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      userId: new mongoose.Types.ObjectId(userId),
      role: ParticipantRole.PARTICIPANT,
      attendanceStatus: AttendanceStatus.NOT_JOINED,
    });
  }

  participant.invitationStatus = body.status as any;
  participant.respondedAt = new Date();
  if (body.status === InvitationStatus.DECLINED && body.declineReason) {
    participant.declineReason = body.declineReason;
  }
  await participant.save();

  const action =
    body.status === InvitationStatus.ACCEPTED
      ? MeetingActivityAction.PARTICIPANT_ACCEPTED
      : body.status === InvitationStatus.DECLINED
      ? MeetingActivityAction.PARTICIPANT_DECLINED
      : MeetingActivityAction.PARTICIPANT_INVITED;

  await logMeetingActivity(
    workspaceId,
    meeting._id,
    userId,
    action,
    "Participant",
    participant._id,
    { status: body.status, declineReason: body.declineReason }
  );

  return { participant };
};

export const recordAttendanceService = async (
  workspaceId: string,
  meetingId: string,
  userId: string,
  attendanceStatus: string
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  let participant = await MeetingParticipantModel.findOne({
    meetingId: meeting._id,
    userId,
  });

  if (!participant) {
    participant = new MeetingParticipantModel({
      meetingId: meeting._id,
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      userId: new mongoose.Types.ObjectId(userId),
      role: ParticipantRole.PARTICIPANT,
      invitationStatus: InvitationStatus.ACCEPTED,
    });
  }

  participant.attendanceStatus = attendanceStatus as any;
  if (attendanceStatus === AttendanceStatus.JOINED) {
    participant.joinedAt = new Date();
  } else if (attendanceStatus === AttendanceStatus.LEFT) {
    participant.leftAt = new Date();
  }
  await participant.save();

  return { participant };
};

// ==========================================
// TOPIC SERVICES
// ==========================================
export const createTopicService = async (
  workspaceId: string,
  meetingId: string,
  userId: string,
  userRole: string,
  body: {
    title: string;
    description?: string;
    priority?: string;
    assignedTo?: string | null;
    attachments?: Array<{ name: string; url: string; type?: string; size?: number }>;
  }
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  if (meeting.isAgendaFinalized) {
    throw new BadRequestException("The agenda for this meeting has been finalized");
  }

  const isOrganizerOrCo = canUserManageMeeting(meeting, userId, userRole);
  const source = isOrganizerOrCo ? TopicSource.ORGANIZER : TopicSource.PARTICIPANT;
  const status = isOrganizerOrCo ? TopicStatus.APPROVED : TopicStatus.SUBMITTED;

  // Determine current max order
  const lastTopic = await MeetingTopicModel.findOne({ meetingId }).sort({ order: -1 });
  const nextOrder = lastTopic ? lastTopic.order + 1 : 0;

  const topic = new MeetingTopicModel({
    meetingId: meeting._id,
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    title: body.title.trim(),
    description: body.description || "",
    createdBy: new mongoose.Types.ObjectId(userId),
    assignedTo: body.assignedTo ? new mongoose.Types.ObjectId(body.assignedTo) : null,
    source,
    priority: (body.priority as any) || TopicPriority.MEDIUM,
    status,
    order: nextOrder,
    attachments: body.attachments || [],
    reviewedBy: isOrganizerOrCo ? new mongoose.Types.ObjectId(userId) : null,
    reviewedAt: isOrganizerOrCo ? new Date() : null,
  });

  await topic.save();

  await logMeetingActivity(
    workspaceId,
    meeting._id,
    userId,
    isOrganizerOrCo ? MeetingActivityAction.TOPIC_APPROVED : MeetingActivityAction.TOPIC_SUBMITTED,
    "Topic",
    topic._id,
    { title: topic.title, status: topic.status }
  );

  return { topic };
};

export const updateTopicService = async (
  workspaceId: string,
  meetingId: string,
  topicId: string,
  userId: string,
  userRole: string,
  body: {
    title?: string;
    description?: string;
    priority?: string;
    assignedTo?: string | null;
    status?: string;
    attachments?: any[];
  }
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  const topic = await MeetingTopicModel.findOne({ _id: topicId, meetingId });
  if (!topic) {
    throw new NotFoundException("Topic not found");
  }

  const isOrganizerOrCo = canUserManageMeeting(meeting, userId, userRole);
  const isCreator = topic.createdBy.toString() === userId.toString();

  if (!isOrganizerOrCo && !isCreator) {
    throw new UnauthorizedException("You are not authorized to update this topic");
  }

  if (meeting.isAgendaFinalized && !isOrganizerOrCo) {
    throw new BadRequestException("The agenda is finalized and cannot be modified");
  }

  if (body.title) topic.title = body.title.trim();
  if (body.description !== undefined) topic.description = body.description;
  if (body.priority) topic.priority = body.priority as any;
  if (body.assignedTo !== undefined) {
    topic.assignedTo = body.assignedTo ? new mongoose.Types.ObjectId(body.assignedTo) : null;
  }
  if (body.status && isOrganizerOrCo) {
    topic.status = body.status as any;
  }
  if (body.attachments) topic.attachments = body.attachments;

  await topic.save();

  return { topic };
};

export const reviewTopicService = async (
  workspaceId: string,
  meetingId: string,
  topicId: string,
  userId: string,
  userRole: string,
  reviewStatus: string
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  if (!canUserManageMeeting(meeting, userId, userRole)) {
    throw new UnauthorizedException("You are not authorized to review topics");
  }

  const topic = await MeetingTopicModel.findOne({ _id: topicId, meetingId });
  if (!topic) {
    throw new NotFoundException("Topic not found");
  }

  topic.status = reviewStatus as any;
  topic.reviewedBy = new mongoose.Types.ObjectId(userId);
  topic.reviewedAt = new Date();
  await topic.save();

  await logMeetingActivity(
    workspaceId,
    meeting._id,
    userId,
    reviewStatus === TopicStatus.APPROVED
      ? MeetingActivityAction.TOPIC_APPROVED
      : MeetingActivityAction.TOPIC_REJECTED,
    "Topic",
    topic._id,
    { title: topic.title, status: topic.status }
  );

  return { topic };
};

export const deleteTopicService = async (
  workspaceId: string,
  meetingId: string,
  topicId: string,
  userId: string,
  userRole: string
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  const topic = await MeetingTopicModel.findOne({ _id: topicId, meetingId });
  if (!topic) {
    throw new NotFoundException("Topic not found");
  }

  const isOrganizerOrCo = canUserManageMeeting(meeting, userId, userRole);
  const isCreator = topic.createdBy.toString() === userId.toString();

  if (!isOrganizerOrCo && !isCreator) {
    throw new UnauthorizedException("You are not authorized to delete this topic");
  }

  await MeetingTopicModel.findByIdAndDelete(topicId);

  return { message: "Topic deleted successfully" };
};

export const reorderTopicsService = async (
  workspaceId: string,
  meetingId: string,
  userId: string,
  userRole: string,
  topicIds: string[]
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  if (!canUserManageMeeting(meeting, userId, userRole)) {
    throw new UnauthorizedException("You are not authorized to reorder topics");
  }

  const updatePromises = topicIds.map((id, index) =>
    MeetingTopicModel.updateOne({ _id: id, meetingId }, { $set: { order: index } })
  );
  await Promise.all(updatePromises);

  return { message: "Topics reordered successfully" };
};

export const finalizeAgendaService = async (
  workspaceId: string,
  meetingId: string,
  userId: string,
  userRole: string
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  if (!canUserManageMeeting(meeting, userId, userRole)) {
    throw new UnauthorizedException("You are not authorized to finalize the agenda");
  }

  meeting.isAgendaFinalized = true;
  await meeting.save();

  await logMeetingActivity(
    workspaceId,
    meeting._id,
    userId,
    MeetingActivityAction.AGENDA_FINALIZED,
    "Meeting",
    meeting._id
  );

  return { meeting };
};

// ==========================================
// MINUTES SERVICES
// ==========================================
export const upsertMinutesService = async (
  workspaceId: string,
  meetingId: string,
  userId: string,
  userRole: string,
  body: {
    summary?: string;
    decisions?: string[];
    unresolvedIssues?: string[];
  }
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  if (!canUserManageMeeting(meeting, userId, userRole)) {
    throw new UnauthorizedException("You are not authorized to manage meeting minutes");
  }

  let minutes = await MeetingMinutesModel.findOne({ meetingId });

  if (!minutes) {
    minutes = new MeetingMinutesModel({
      meetingId: meeting._id,
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      summary: body.summary || "",
      decisions: body.decisions || [],
      unresolvedIssues: body.unresolvedIssues || [],
      recordedBy: new mongoose.Types.ObjectId(userId),
    });
  } else {
    if (body.summary !== undefined) minutes.summary = body.summary;
    if (body.decisions) minutes.decisions = body.decisions;
    if (body.unresolvedIssues) minutes.unresolvedIssues = body.unresolvedIssues;
    minutes.updatedBy = new mongoose.Types.ObjectId(userId);
  }

  await minutes.save();

  await logMeetingActivity(
    workspaceId,
    meeting._id,
    userId,
    MeetingActivityAction.MINUTES_UPDATED,
    "Minutes",
    minutes._id
  );

  return { minutes };
};

// ==========================================
// ACTION ITEM SERVICES
// ==========================================
export const createActionItemService = async (
  workspaceId: string,
  meetingId: string,
  userId: string,
  userRole: string,
  body: {
    topicId?: string | null;
    title: string;
    description?: string;
    assignedTo?: string | null;
    priority?: string;
    dueAt?: string | Date | null;
  }
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  if (!canUserManageMeeting(meeting, userId, userRole)) {
    throw new UnauthorizedException("You are not authorized to create action items");
  }

  const actionItem = new MeetingActionItemModel({
    meetingId: meeting._id,
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    topicId: body.topicId ? new mongoose.Types.ObjectId(body.topicId) : null,
    title: body.title.trim(),
    description: body.description || "",
    assignedTo: body.assignedTo ? new mongoose.Types.ObjectId(body.assignedTo) : null,
    createdBy: new mongoose.Types.ObjectId(userId),
    priority: (body.priority as any) || ActionItemPriority.MEDIUM,
    status: ActionItemStatus.OPEN,
    dueAt: body.dueAt ? new Date(body.dueAt) : null,
  });

  await actionItem.save();

  await logMeetingActivity(
    workspaceId,
    meeting._id,
    userId,
    MeetingActivityAction.ACTION_ITEM_CREATED,
    "ActionItem",
    actionItem._id,
    { title: actionItem.title }
  );

  return { actionItem };
};

export const updateActionItemService = async (
  workspaceId: string,
  meetingId: string,
  actionItemId: string,
  userId: string,
  userRole: string,
  body: {
    title?: string;
    description?: string;
    assignedTo?: string | null;
    priority?: string;
    status?: string;
    dueAt?: string | Date | null;
  }
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  const actionItem = await MeetingActionItemModel.findOne({
    _id: actionItemId,
    meetingId,
  });
  if (!actionItem) {
    throw new NotFoundException("Action item not found");
  }

  if (body.title) actionItem.title = body.title.trim();
  if (body.description !== undefined) actionItem.description = body.description;
  if (body.assignedTo !== undefined) {
    actionItem.assignedTo = body.assignedTo ? new mongoose.Types.ObjectId(body.assignedTo) : null;
  }
  if (body.priority) actionItem.priority = body.priority as any;
  if (body.status) actionItem.status = body.status as any;
  if (body.dueAt !== undefined) {
    actionItem.dueAt = body.dueAt ? new Date(body.dueAt) : null;
  }

  await actionItem.save();

  return { actionItem };
};

export const convertActionItemToTaskService = async (
  workspaceId: string,
  meetingId: string,
  actionItemId: string,
  userId: string,
  body: {
    projectId: string;
    teamId?: string | null;
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string | null;
  }
) => {
  const meeting = await MeetingModel.findOne({ _id: meetingId, workspaceId });
  if (!meeting) {
    throw new NotFoundException("Meeting not found");
  }

  const actionItem = await MeetingActionItemModel.findOne({
    _id: actionItemId,
    meetingId,
  });
  if (!actionItem) {
    throw new NotFoundException("Action item not found");
  }

  if (actionItem.linkedTaskId) {
    throw new BadRequestException("Action item has already been converted to a project task");
  }

  const project = await ProjectModel.findOne({
    _id: body.projectId,
    workspace: workspaceId,
  });
  if (!project) {
    throw new NotFoundException("Project not found in this workspace");
  }

  // Generate task title & description
  const taskTitle = body.title || actionItem.title;
  const taskDescription =
    body.description ||
    actionItem.description ||
    `Created from meeting: "${meeting.title}" outcome.`;

  // Create Task using existing TaskModel conventions
  const task = new TaskModel({
    title: taskTitle,
    description: taskDescription,
    project: project._id,
    workspace: new mongoose.Types.ObjectId(workspaceId),
    createdBy: new mongoose.Types.ObjectId(userId),
    assignedTo: actionItem.assignedTo ? [actionItem.assignedTo] : [],
    priority: body.priority || actionItem.priority || "MEDIUM",
    status: body.status || "TODO",
    dueDate: body.dueDate ? new Date(body.dueDate) : actionItem.dueAt || null,
    team: body.teamId ? new mongoose.Types.ObjectId(body.teamId) : null,
  });

  await task.save();

  // Update Action Item
  actionItem.status = ActionItemStatus.CONVERTED_TO_TASK;
  actionItem.linkedTaskId = task._id as any;
  actionItem.convertedAt = new Date();
  await actionItem.save();

  await logMeetingActivity(
    workspaceId,
    meeting._id,
    userId,
    MeetingActivityAction.ACTION_ITEM_CONVERTED,
    "ActionItem",
    actionItem._id,
    { taskId: task._id, taskTitle: task.title, projectId: project._id }
  );

  return { actionItem, task };
};

// ==========================================
// ACTIVITY FEED SERVICE
// ==========================================
export const getMeetingActivitiesService = async (
  workspaceId: string,
  meetingId: string
) => {
  const activities = await MeetingActivityModel.find({
    workspaceId,
    meetingId,
  })
    .populate("actorId", "name email profilePicture")
    .sort({ createdAt: -1 })
    .lean();

  return { activities };
};
