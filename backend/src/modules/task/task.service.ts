import mongoose from "mongoose";
import { TaskPriorityEnum, TaskStatusEnum } from "./task.enum";
import MemberModel from "../member/member.model";
import ProjectModel from "../project/project.model";
import TeamModel from "../teams/teams.model";
import TaskModel from "./task.model";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../../common/utils/appError";
import AssociationModel, {
  AssociationStatus,
} from "../association/association.model";
import {
  AssociationRoles,
  AssociationScope,
  WorkspaceRoles,
} from "../../common/enums/association.enum";
import { getMemberRoleInWorkspace } from "../member/member.service";
import {
  notificationService,
  NotificationTypeEnum,
  NotificationPriorityEnum,
} from "../notification";

// Helper to verify user authority for project and team tasks
export interface TaskAuthority {
  canAssignAnywhere: boolean; // Workspace Owner, Admin, Manager
  isProjectLead: boolean;     // Project Head, Lead, Creator
  isTeamLead: boolean;        // Team Head, Lead, Creator
  leadTeamIds: string[];      // IDs of teams where user is Lead or Head
  isMember: boolean;          // Regular member
}

export const getUserTaskAuthority = async (
  userId: string,
  workspaceId: string,
  projectId: string
): Promise<TaskAuthority> => {
  const { role: workspaceRole } = await getMemberRoleInWorkspace(userId, workspaceId);
  if (
    workspaceRole === WorkspaceRoles.OWNER ||
    workspaceRole === WorkspaceRoles.ADMIN ||
    workspaceRole === WorkspaceRoles.MANAGER
  ) {
    return {
      canAssignAnywhere: true,
      isProjectLead: true,
      isTeamLead: true,
      leadTeamIds: [],
      isMember: false,
    };
  }

  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  });
  if (!project) {
    throw new NotFoundException("Project not found or does not belong to this workspace");
  }

  const isCreator = project.createdBy.toString() === userId.toString();

  const currentMember = await MemberModel.findOne({
    userId,
    workspaceId,
  });

  if (!currentMember) {
    return {
      canAssignAnywhere: false,
      isProjectLead: false,
      isTeamLead: false,
      leadTeamIds: [],
      isMember: true,
    };
  }

  let isProjectHeadOrLead = isCreator;
  if (!isProjectHeadOrLead) {
    const projectAssoc = await AssociationModel.findOne({
      memberId: currentMember._id,
      workspaceId,
      scopeType: AssociationScope.PROJECT,
      scopeId: project._id,
      status: AssociationStatus.ACTIVE,
      role: { $in: [AssociationRoles.HEAD, AssociationRoles.LEAD] },
    });
    if (projectAssoc) isProjectHeadOrLead = true;
  }

  if (isProjectHeadOrLead) {
    return {
      canAssignAnywhere: false,
      isProjectLead: true,
      isTeamLead: true,
      leadTeamIds: [],
      isMember: false,
    };
  }

  // Find all teams under this project
  const projectTeams = await TeamModel.find({
    workspaceId,
    projectId: project._id,
  }).select("_id createdBy");
  const projectTeamIds: mongoose.Types.ObjectId[] = projectTeams.map((t) => t._id);

  if (project.team) projectTeamIds.push(new mongoose.Types.ObjectId(project.team.toString()));
  if (project.teams && Array.isArray(project.teams)) {
    project.teams.forEach((t: any) => {
      const id = t?._id ? t._id : t;
      if (id) projectTeamIds.push(new mongoose.Types.ObjectId(id.toString()));
    });
  }

  const leadTeamIds: string[] = [];

  projectTeams.forEach((t) => {
    if (t.createdBy?.toString() === userId.toString()) {
      leadTeamIds.push(t._id.toString());
    }
  });

  if (projectTeamIds.length > 0) {
    const teamAssocs = await AssociationModel.find({
      memberId: currentMember._id,
      workspaceId,
      scopeType: AssociationScope.TEAM,
      scopeId: { $in: projectTeamIds },
      status: AssociationStatus.ACTIVE,
      role: { $in: [AssociationRoles.HEAD, AssociationRoles.LEAD] },
    }).select("scopeId");

    teamAssocs.forEach((ta) => {
      const sId = ta.scopeId.toString();
      if (!leadTeamIds.includes(sId)) {
        leadTeamIds.push(sId);
      }
    });
  }

  if (leadTeamIds.length > 0) {
    return {
      canAssignAnywhere: false,
      isProjectLead: false,
      isTeamLead: true,
      leadTeamIds,
      isMember: false,
    };
  }

  return {
    canAssignAnywhere: false,
    isProjectLead: false,
    isTeamLead: false,
    leadTeamIds: [],
    isMember: true,
  };
};

// Backward-compatibility wrapper
export const isUserLeadOrHead = async (
  userId: string,
  workspaceId: string,
  projectId: string,
  teamId?: string | null
): Promise<{ isLeadOrHead: boolean; roleName?: string }> => {
  const authority = await getUserTaskAuthority(userId, workspaceId, projectId);
  if (authority.canAssignAnywhere || authority.isProjectLead) {
    return { isLeadOrHead: true, roleName: "LEAD" };
  }
  if (authority.isTeamLead) {
    if (!teamId || teamId === "none" || authority.leadTeamIds.includes(teamId)) {
      return { isLeadOrHead: true, roleName: "TEAM_LEAD" };
    }
  }
  return { isLeadOrHead: false };
};

// Normalize assignees input to an array of user ID strings
export const normalizeAssignees = (assignedTo?: string | string[] | null): string[] => {
  if (!assignedTo) return [];
  if (Array.isArray(assignedTo)) {
    return assignedTo
      .filter(Boolean)
      .map(String)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s !== "none");
  }
  if (typeof assignedTo === "string" && assignedTo.trim().length > 0 && assignedTo.trim() !== "none") {
    return [assignedTo.trim()];
  }
  return [];
};

export const createTaskService = async (
  workspaceId: string,
  projectId: string,
  userId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | string[] | null;
    reportedTo?: string | null;
    dueDate?: string;
    teamId?: string | null;
    team?: string | null;
  }
) => {
  const { title, description, priority, status, dueDate } = body;
  const rawTeamId = body.teamId !== undefined ? body.teamId : body.team;

  const project = await ProjectModel.findById(projectId);
  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  // 1. Determine task authority
  const authority = await getUserTaskAuthority(userId, workspaceId, projectId);
  let assignedUserIds = normalizeAssignees(body.assignedTo);

  let resolvedTeamId: mongoose.Types.ObjectId | null = null;

  // Requirement 4:
  // - Workspace owner, admin, manager & project head, lead can assign tasks.
  // - Team lead or head can assign task to ONLY those who belong to that team.
  // - Regular member can create task for their own self only.
  if (authority.isMember) {
    if (rawTeamId && rawTeamId !== "none") {
      throw new UnauthorizedException(
        "Members cannot assign tasks to teams."
      );
    }
    if (assignedUserIds.length === 0) {
      assignedUserIds = [userId];
    } else if (assignedUserIds.some((id) => id !== userId.toString())) {
      throw new UnauthorizedException(
        "Members can only create tasks for themselves."
      );
    }
  } else if (authority.isTeamLead && !authority.isProjectLead && !authority.canAssignAnywhere) {
    if (!rawTeamId || rawTeamId === "none") {
      throw new UnauthorizedException(
        "Team leads must assign tasks to their team."
      );
    }
    if (!authority.leadTeamIds.includes(rawTeamId.toString())) {
      throw new UnauthorizedException(
        "You can only assign tasks to a team you lead."
      );
    }

    const teamDoc = await TeamModel.findOne({ _id: rawTeamId, workspaceId });
    if (!teamDoc) {
      throw new NotFoundException("Team not found in this workspace");
    }
    resolvedTeamId = teamDoc._id;

    // Verify all assignees belong to that team
    if (assignedUserIds.length > 0) {
      const assignedMembers: any[] = await MemberModel.find({
        workspaceId,
        userId: { $in: assignedUserIds },
      }).select("_id userId");

      const assignedMemberIds = assignedMembers.map((m) => m._id);

      const teamAssocs = await AssociationModel.find({
        workspaceId,
        scopeType: AssociationScope.TEAM,
        scopeId: teamDoc._id,
        memberId: { $in: assignedMemberIds },
        status: AssociationStatus.ACTIVE,
      }).select("memberId");

      const activeMemberIdStrings = new Set(teamAssocs.map((a) => a.memberId.toString()));

      for (const m of assignedMembers) {
        const isTeamCreator = teamDoc.createdBy?.toString() === m.userId.toString();
        if (!activeMemberIdStrings.has(m._id.toString()) && !isTeamCreator) {
          throw new UnauthorizedException(
            "Team leads can only assign tasks to members who belong to their team."
          );
        }
      }
    }
  } else {
    // Project Lead or Workspace Admin / Manager
    if (rawTeamId && rawTeamId !== "none") {
      if (!mongoose.isValidObjectId(rawTeamId)) {
        throw new BadRequestException("Invalid team ID provided");
      }
      const teamDoc = await TeamModel.findOne({ _id: rawTeamId, workspaceId });
      if (!teamDoc) {
        throw new NotFoundException("Team not found in this workspace");
      }
      resolvedTeamId = teamDoc._id;

      await ProjectModel.findByIdAndUpdate(projectId, {
        $addToSet: { teams: teamDoc._id },
      });
    }
  }

  // 2. Validate all assigned users exist in this workspace
  if (assignedUserIds.length > 0) {
    const existingCount = await MemberModel.countDocuments({
      workspaceId,
      userId: { $in: assignedUserIds },
    });
    if (existingCount < assignedUserIds.length) {
      throw new BadRequestException("One or more assigned users are not members of this workspace.");
    }
  }

  // 3. Validate reportedTo if provided
  let resolvedReportedTo: mongoose.Types.ObjectId | null = null;
  if (body.reportedTo && body.reportedTo.trim() !== "" && body.reportedTo !== "none") {
    const reportedMember = await MemberModel.findOne({
      workspaceId,
      userId: body.reportedTo.trim(),
    });
    if (!reportedMember) {
      throw new BadRequestException("Reported-to user is not a member of this workspace.");
    }
    resolvedReportedTo = new mongoose.Types.ObjectId(body.reportedTo.trim());
  }

  const task = new TaskModel({
    title,
    description,
    priority: priority || TaskPriorityEnum.MEDIUM,
    status: status || TaskStatusEnum.TODO,
    assignedTo: assignedUserIds.map((id) => new mongoose.Types.ObjectId(id)),
    reportedTo: resolvedReportedTo,
    createdBy: userId,
    workspace: workspaceId,
    project: projectId,
    team: resolvedTeamId,
    dueDate,
  });

  await task.save();

  // Populate populatedTask
  await task.populate([
    { path: "assignedTo", select: "_id name profilePicture email -password" },
    { path: "reportedTo", select: "_id name profilePicture email -password" },
    { path: "project", select: "_id emoji name" },
    { path: "team", select: "_id name slug description status" },
  ]);

  // Queue notifications for all assignees
  for (const assigneeId of assignedUserIds) {
    if (assigneeId !== userId.toString()) {
      void notificationService
        .queueNotification({
          recipient: assigneeId,
          sender: userId,
          workspaceId,
          type: NotificationTypeEnum.TASK_ASSIGNED,
          title: "New Task Assigned",
          message: `You have been assigned to task "${task.title}"`,
          data: {
            taskId: String(task._id),
            taskCode: task.taskCode,
            projectId,
            workspaceId,
          },
          priority:
            task.priority === TaskPriorityEnum.HIGH
              ? NotificationPriorityEnum.HIGH
              : NotificationPriorityEnum.MEDIUM,
        })
        .catch((err) =>
          console.warn("[Notification] Failed to queue task assignment notification:", err)
        );
    }
  }

  return { task };
};

export const updateTaskService = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  userId: string,
  body: {
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    assignedTo?: string | string[] | null;
    reportedTo?: string | null;
    dueDate?: string;
    teamId?: string | null;
    team?: string | null;
  }
) => {
  const project = await ProjectModel.findById(projectId);
  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException("Project not found or does not belong to this workspace");
  }

  const task = await TaskModel.findById(taskId);
  if (!task || task.project.toString() !== projectId.toString()) {
    throw new NotFoundException("Task not found or does not belong to this project");
  }

  const rawTeamId = body.teamId !== undefined ? body.teamId : body.team;

  const authority = await getUserTaskAuthority(userId, workspaceId, projectId);
  const updatePayload: Record<string, any> = {};

  if (body.title !== undefined) updatePayload.title = body.title;
  if (body.description !== undefined) updatePayload.description = body.description;
  if (body.priority !== undefined) updatePayload.priority = body.priority;
  if (body.status !== undefined) updatePayload.status = body.status;
  if (body.dueDate !== undefined) updatePayload.dueDate = body.dueDate;

  if (body.reportedTo !== undefined) {
    if (!body.reportedTo || body.reportedTo === "none") {
      updatePayload.reportedTo = null;
    } else {
      const reportedMember = await MemberModel.findOne({
        workspaceId,
        userId: body.reportedTo.trim(),
      });
      if (!reportedMember) {
        throw new BadRequestException("Reported-to user is not a member of this workspace.");
      }
      updatePayload.reportedTo = new mongoose.Types.ObjectId(body.reportedTo.trim());
    }
  }

  let finalAssignedIds: string[] | null = null;
  if (body.assignedTo !== undefined) {
    finalAssignedIds = normalizeAssignees(body.assignedTo);
  }

  // Enforce assignment permissions
  if (authority.isMember) {
    if (rawTeamId !== undefined && rawTeamId !== null && rawTeamId !== "" && rawTeamId !== "none") {
      throw new UnauthorizedException("Members cannot assign tasks to teams.");
    }
    if (finalAssignedIds !== null) {
      if (finalAssignedIds.some((id) => id !== userId.toString())) {
        throw new UnauthorizedException("Members can only assign tasks to themselves.");
      }
    }
  } else if (authority.isTeamLead && !authority.isProjectLead && !authority.canAssignAnywhere) {
    const effectiveTeamId = rawTeamId !== undefined ? rawTeamId : task.team?.toString();
    if (!effectiveTeamId || effectiveTeamId === "none" || !authority.leadTeamIds.includes(effectiveTeamId.toString())) {
      throw new UnauthorizedException("Team leads must assign tasks to their team.");
    }

    if (finalAssignedIds && finalAssignedIds.length > 0) {
      const assignedMembers: any[] = await MemberModel.find({
        workspaceId,
        userId: { $in: finalAssignedIds },
      }).select("_id userId");

      const assignedMemberIds = assignedMembers.map((m) => m._id);

      const teamAssocs = await AssociationModel.find({
        workspaceId,
        scopeType: AssociationScope.TEAM,
        scopeId: effectiveTeamId,
        memberId: { $in: assignedMemberIds },
        status: AssociationStatus.ACTIVE,
      }).select("memberId");

      const activeMemberIdStrings = new Set(teamAssocs.map((a) => a.memberId.toString()));
      const teamDoc = await TeamModel.findById(effectiveTeamId);

      for (const m of assignedMembers) {
        const isTeamCreator = teamDoc?.createdBy?.toString() === m.userId.toString();
        if (!activeMemberIdStrings.has(m._id.toString()) && !isTeamCreator) {
          throw new UnauthorizedException(
            "Team leads can only assign tasks to members who belong to their team."
          );
        }
      }
    }
  }

  if (finalAssignedIds !== null) {
    updatePayload.assignedTo = finalAssignedIds.map((id) => new mongoose.Types.ObjectId(id));
  }

  if (rawTeamId !== undefined) {
    if (rawTeamId === null || rawTeamId === "" || rawTeamId === "none") {
      updatePayload.team = null;
    } else {
      if (!mongoose.isValidObjectId(rawTeamId)) {
        throw new BadRequestException("Invalid team ID provided");
      }
      const teamDoc = await TeamModel.findOne({ _id: rawTeamId, workspaceId });
      if (!teamDoc) {
        throw new NotFoundException("Team not found in this workspace");
      }
      updatePayload.team = teamDoc._id;

      await ProjectModel.findByIdAndUpdate(projectId, {
        $addToSet: { teams: teamDoc._id },
      });
    }
  }

  const updatedTask = await TaskModel.findByIdAndUpdate(
    taskId,
    updatePayload,
    { new: true }
  )
    .populate("assignedTo", "_id name profilePicture email -password")
    .populate("reportedTo", "_id name profilePicture email -password")
    .populate("project", "_id emoji name")
    .populate("team", "_id name slug description status");

  if (!updatedTask) {
    throw new BadRequestException("Failed to update task");
  }

  // Notify newly assigned users
  if (finalAssignedIds && finalAssignedIds.length > 0) {
    const existingAssigneeIds = (task.assignedTo || []).map((id: any) => id.toString());
    for (const newAssigneeId of finalAssignedIds) {
      if (!existingAssigneeIds.includes(newAssigneeId) && newAssigneeId !== userId.toString()) {
        void notificationService
          .queueNotification({
            recipient: newAssigneeId,
            sender: userId,
            workspaceId,
            type: NotificationTypeEnum.TASK_ASSIGNED,
            title: "Task Assigned",
            message: `You have been assigned to task "${updatedTask.title}"`,
            data: {
              taskId: String(updatedTask._id),
              taskCode: updatedTask.taskCode,
              projectId,
              workspaceId,
            },
            priority:
              updatedTask.priority === TaskPriorityEnum.HIGH
                ? NotificationPriorityEnum.HIGH
                : NotificationPriorityEnum.MEDIUM,
          })
          .catch((err) =>
            console.warn("[Notification] Failed to queue task assignment notification:", err)
          );
      }
    }
  }

  return { updatedTask };
};

export const getAllTasksService = async (
  workspaceId: string,
  filters: {
    projectId?: string;
    teamId?: string[];
    status?: string[];
    priority?: string[];
    assignedTo?: string | string[];
    keyword?: string;
    dueDate?: string;
  },
  pagination: {
    pageSize: number;
    pageNumber: number;
  }
) => {
  const query: Record<string, any> = {
    workspace: workspaceId,
  };

  if (filters.projectId) {
    query.project = filters.projectId;
  }

  if (filters.teamId && filters.teamId.length > 0) {
    query.team = { $in: filters.teamId };
  }

  if (filters.status && filters.status?.length > 0) {
    query.status = { $in: filters.status };
  }

  if (filters.priority && filters.priority?.length > 0) {
    query.priority = { $in: filters.priority };
  }

  if (filters.assignedTo) {
    const assignedArray = Array.isArray(filters.assignedTo)
      ? filters.assignedTo
      : [filters.assignedTo];
    if (assignedArray.length > 0) {
      query.assignedTo = { $in: assignedArray };
    }
  }

  if (filters.keyword && filters.keyword !== undefined) {
    query.title = { $regex: filters.keyword, $options: "i" };
  }

  if (filters.dueDate) {
    query.dueDate = {
      $eq: new Date(filters.dueDate),
    };
  }

  //Pagination Setup
  const { pageSize, pageNumber } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  const [tasks, totalCount] = await Promise.all([
    TaskModel.find(query)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .populate("assignedTo", "_id name profilePicture email -password")
      .populate("reportedTo", "_id name profilePicture email -password")
      .populate("project", "_id emoji name")
      .populate("team", "_id name slug description status"),
    TaskModel.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    tasks,
    pagination: {
      pageSize,
      pageNumber,
      totalCount,
      totalPages,
      skip,
    },
  };
};

export const getTaskByIdService = async (
  workspaceId: string,
  projectId: string,
  taskId: string
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await TaskModel.findOne({
    _id: taskId,
    workspace: workspaceId,
    project: projectId,
  })
    .populate("assignedTo", "_id name profilePicture email -password")
    .populate("reportedTo", "_id name profilePicture email -password")
    .populate("project", "_id emoji name")
    .populate("team", "_id name slug description status");

  if (!task) {
    throw new NotFoundException("Task not found.");
  }

  return task;
};

export const deleteTaskService = async (
  workspaceId: string,
  taskId: string
) => {
  const task = await TaskModel.findOneAndDelete({
    _id: taskId,
    workspace: workspaceId,
  });

  if (!task) {
    throw new NotFoundException(
      "Task not found or does not belong to the specified workspace"
    );
  }

  return;
};
