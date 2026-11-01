import mongoose from "mongoose";
import ProjectModel from "./project.model";
import TeamModel from "../teams/teams.model";
import { BadRequestException, NotFoundException } from "../../common/utils/appError";
import { TaskStatusEnum } from "../task/task.enum";
import { TaskModel } from "../task";
import {
  AssociationRoles,
  AssociationRoleType,
  AssociationScope,
} from "../../common/enums/association.enum";
import AssociationModel, {
  AssociationStatus,
} from "../association/association.model";
import MemberModel from "../member/member.model";
import { resolveMember } from "../association/association.service";

export const createProjectService = async (
  userId: string,
  workspaceId: string,
  body: {
    emoji?: string;
    name: string;
    description?: string;
    teamId?: string;
    teamIds?: string[];
    newTeam?: {
      name: string;
      description?: string;
      members?: Array<{
        memberId?: string;
        userId?: string;
        role?: AssociationRoleType;
      }>;
    };
    leadUserId?: string;
    members?: Array<{
      memberId?: string;
      userId?: string;
      role?: AssociationRoleType;
    }>;
  },
) => {
  const resolvedTeamIds: mongoose.Types.ObjectId[] = [];

  // 1. Handle Multiple Teams or Single Team Association
  if (body.newTeam && body.newTeam.name.trim()) {
    const existingTeam = await TeamModel.findOne({
      workspaceId,
      name: body.newTeam.name.trim(),
    });

    let teamDoc;
    if (existingTeam) {
      teamDoc = existingTeam;
    } else {
      teamDoc = await TeamModel.create({
        workspaceId,
        name: body.newTeam.name.trim(),
        description: body.newTeam.description?.trim() || null,
        createdBy: userId,
        status: "ACTIVE",
      });

      // Associate initial team members with their selected roles
      if (body.newTeam.members && Array.isArray(body.newTeam.members) && body.newTeam.members.length > 0) {
        for (const m of body.newTeam.members) {
          try {
            const member = await resolveMember(workspaceId, m.memberId, m.userId);
            if (member) {
              await AssociationModel.findOneAndUpdate(
                {
                  memberId: member._id,
                  workspaceId,
                  scopeType: AssociationScope.TEAM,
                  scopeId: teamDoc._id,
                },
                {
                  $setOnInsert: {
                    memberId: member._id,
                    workspaceId,
                    scopeType: AssociationScope.TEAM,
                    scopeId: teamDoc._id,
                    joinedAt: new Date(),
                  },
                  $set: {
                    status: AssociationStatus.ACTIVE,
                    role: m.role || AssociationRoles.MEMBER,
                  },
                },
                { upsert: true, new: true }
              );
            }
          } catch (err) {
            console.error("Failed to associate member to new team:", err);
          }
        }
      }
    }
    resolvedTeamIds.push(teamDoc._id);
  }

  if (body.teamIds && Array.isArray(body.teamIds) && body.teamIds.length > 0) {
    const validTeams = await TeamModel.find({
      _id: { $in: body.teamIds.map((id) => new mongoose.Types.ObjectId(id)) },
      workspaceId,
    }).select("_id");
    validTeams.forEach((t) => {
      if (!resolvedTeamIds.some((id) => id.equals(t._id))) {
        resolvedTeamIds.push(t._id);
      }
    });
  } else if (body.teamId) {
    const existingTeam = await TeamModel.findOne({
      _id: body.teamId,
      workspaceId,
    });
    if (!existingTeam) {
      throw new NotFoundException("Selected team does not exist in this workspace");
    }
    if (!resolvedTeamIds.some((id) => id.equals(existingTeam._id))) {
      resolvedTeamIds.push(existingTeam._id);
    }
  }

  // 2. Create the Project
  const project = new ProjectModel({
    ...(body.emoji && { emoji: body.emoji }),
    name: body.name,
    description: body.description,
    workspace: workspaceId,
    team: resolvedTeamIds[0] || null,
    teams: resolvedTeamIds,
    createdBy: userId,
  });

  await project.save();

  // 3. Associate the designated Project Lead ONLY IF explicitly provided
  // (Do not default to userId / creator - the creator will not be associated unless they join themselves)
  let leadMemberDoc: any = null;
  if (body.leadUserId) {
    const leadMember = await MemberModel.findOne({
      userId: body.leadUserId,
      workspaceId,
    });

    if (leadMember) {
      leadMemberDoc = leadMember;
      await AssociationModel.findOneAndUpdate(
        {
          memberId: leadMember._id,
          workspaceId,
          scopeType: AssociationScope.PROJECT,
          scopeId: project._id,
        },
        {
          $setOnInsert: {
            memberId: leadMember._id,
            workspaceId,
            scopeType: AssociationScope.PROJECT,
            scopeId: project._id,
            role: AssociationRoles.HEAD,
            joinedAt: new Date(),
          },
          $set: {
            status: AssociationStatus.ACTIVE,
          },
        },
        { upsert: true, new: true }
      );
    }
  }

  // 4. Associate initial members if provided
  if (body.members && Array.isArray(body.members) && body.members.length > 0) {
    for (const memberItem of body.members) {
      try {
        const member = await resolveMember(
          workspaceId,
          memberItem.memberId,
          memberItem.userId
        );
        if (member && (!leadMemberDoc || String((member as any)._id) !== String((leadMemberDoc as any)?._id))) {
          await AssociationModel.findOneAndUpdate(
            {
              memberId: member._id,
              workspaceId,
              scopeType: AssociationScope.PROJECT,
              scopeId: project._id,
            },
            {
              $setOnInsert: {
                memberId: member._id,
                workspaceId,
                scopeType: AssociationScope.PROJECT,
                scopeId: project._id,
                role: memberItem.role || AssociationRoles.MEMBER,
                joinedAt: new Date(),
              },
              $set: {
                status: AssociationStatus.ACTIVE,
                role: memberItem.role || AssociationRoles.MEMBER,
              },
            },
            { upsert: true, new: true }
          );
        }
      } catch (err) {
        console.error("Failed to associate member during project creation:", err);
      }
    }
  }

  const populatedProject = await ProjectModel.findById(project._id)
    .populate("team", "_id name slug description status")
    .populate("teams", "_id name slug description status")
    .populate("createdBy", "_id name profilePicture -password");

  return { project: populatedProject || project };
};

export const getProjectsInWorkspaceService = async (
  workspaceId: string,
  pageSize: number,
  pageNumber: number,
  keyword?: string,
) => {
  const query: Record<string, any> = {
    workspace: workspaceId,
  };

  if (keyword && keyword.trim() !== "") {
    query.name = { $regex: keyword.trim(), $options: "i" };
  }

  const totalCount = await ProjectModel.countDocuments(query);

  const skip = (pageNumber - 1) * pageSize;

  const projects = await ProjectModel.find(query)
    .skip(skip)
    .limit(pageSize)
    .populate("team", "_id name slug description status")
    .populate("teams", "_id name slug description status")
    .populate("createdBy", "_id name profilePicture -password")
    .sort({ createdAt: -1 });

  const totalPages = Math.ceil(totalCount / pageSize);

  return { projects, totalCount, totalPages, skip };
};

export const getProjectByIdAndWorkspaceIdService = async (
  workspaceId: string,
  projectId: string,
) => {
  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  })
    .populate("team", "_id name slug description status")
    .populate("teams", "_id name slug description status")
    .populate("createdBy", "_id name profilePicture -password");

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to the specified workspace",
    );
  }

  return { project };
};

export const getProjectsByTeamService = async (
  workspaceId: string,
  teamId: string,
  pageSize: number = 10,
  pageNumber: number = 1,
) => {
  const query = {
    workspace: workspaceId,
    $or: [{ team: teamId }, { teams: teamId }],
  };

  const totalCount = await ProjectModel.countDocuments(query);
  const skip = (pageNumber - 1) * pageSize;

  const projects = await ProjectModel.find(query)
    .skip(skip)
    .limit(pageSize)
    .populate("team", "_id name slug description status")
    .populate("teams", "_id name slug description status")
    .populate("createdBy", "_id name profilePicture -password")
    .sort({ createdAt: -1 });

  const totalPages = Math.ceil(totalCount / pageSize);

  return { projects, totalCount, totalPages, skip };
};


export const getProjectAnalyticsService = async (
  workspaceId: string,
  projectId: string,
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace",
    );
  }

  const currentDate = new Date();

  const taskAnalytics = await TaskModel.aggregate([
    {
      $match: {
        project: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $facet: {
        totalTasks: [{ $count: "count" }],
        overdueTasks: [
          {
            $match: {
              dueDate: { $lt: currentDate },
              status: {
                $ne: TaskStatusEnum.DONE,
              },
            },
          },
          {
            $count: "count",
          },
        ],
        completedTasks: [
          {
            $match: {
              status: TaskStatusEnum.DONE,
            },
          },
          { $count: "count" },
        ],
      },
    },
  ]);

  const _analytics = taskAnalytics[0];

  const analytics = {
    totalTasks: _analytics.totalTasks[0]?.count || 0,
    overdueTasks: _analytics.overdueTasks[0]?.count || 0,
    completedTasks: _analytics.completedTasks[0]?.count || 0,
  };

  return {
    analytics,
  };
};

export const updateProjectService = async (
  workspaceId: string,
  projectId: string,
  body: {
    emoji?: string;
    name?: string;
    description?: string;
    teamId?: string;
    teamIds?: string[];
  },
) => {
  const { name, emoji, description, teamId, teamIds } = body;

  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  });

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to the specified workspace",
    );
  }

  if (emoji !== undefined) project.emoji = emoji;
  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;

  if (teamIds !== undefined && Array.isArray(teamIds)) {
    const validTeams = await TeamModel.find({
      _id: { $in: teamIds.map((id) => new mongoose.Types.ObjectId(id)) },
      workspaceId,
    }).select("_id");
    project.teams = validTeams.map((t) => t._id);
    if (project.teams.length > 0) {
      if (!project.team || !project.teams.some((t) => t.equals(project.team))) {
        project.team = project.teams[0];
      }
    } else {
      project.team = null;
    }
  } else if (teamId !== undefined) {
    if (teamId) {
      const validTeam = await TeamModel.findOne({ _id: teamId, workspaceId });
      if (validTeam) {
        project.team = validTeam._id;
        if (!project.teams) project.teams = [];
        if (!project.teams.some((t) => t.equals(validTeam._id))) {
          project.teams.push(validTeam._id);
        }
      }
    } else {
      project.team = null;
    }
  }

  await project.save();

  return { project };
};

export const assignTeamsToProjectService = async (
  workspaceId: string,
  projectId: string,
  teamIds: string[],
) => {
  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  });

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace",
    );
  }

  const validTeams = await TeamModel.find({
    _id: { $in: teamIds.map((id) => new mongoose.Types.ObjectId(id)) },
    workspaceId,
  }).select("_id");

  if (validTeams.length === 0) {
    throw new BadRequestException("No valid teams found in this workspace");
  }

  const existingTeamIdStrs = new Set<string>();
  if (project.team) existingTeamIdStrs.add(project.team.toString());
  if (project.teams && Array.isArray(project.teams)) {
    project.teams.forEach((t) => existingTeamIdStrs.add(t.toString()));
  }

  validTeams.forEach((t) => {
    existingTeamIdStrs.add(t._id.toString());
  });

  const updatedTeamObjectIds = Array.from(existingTeamIdStrs).map(
    (id) => new mongoose.Types.ObjectId(id),
  );

  project.teams = updatedTeamObjectIds;
  if (!project.team && updatedTeamObjectIds.length > 0) {
    project.team = updatedTeamObjectIds[0];
  }

  await project.save();

  return { project };
};

export const removeTeamFromProjectService = async (
  workspaceId: string,
  projectId: string,
  teamId: string,
) => {
  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  });

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace",
    );
  }

  const teamObjId = new mongoose.Types.ObjectId(teamId);

  // Remove from project.teams
  if (project.teams && Array.isArray(project.teams)) {
    project.teams = project.teams.filter((t) => !t.equals(teamObjId));
  }

  // If project.team was this team, reassign to remaining team or set null
  if (project.team && project.team.equals(teamObjId)) {
    project.team = project.teams && project.teams.length > 0 ? project.teams[0] : null;
  }

  await project.save();

  return { project };
};

export const deleteProjectService = async (
  workspaceId: string,
  projectId: string,
) => {
  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  });

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to the specified workspace",
    );
  }

  await project.deleteOne();

  await TaskModel.deleteMany({
    project: project._id,
  });

  // Cascade delete associations for this project
  await AssociationModel.deleteMany({
    scopeType: AssociationScope.PROJECT,
    scopeId: project._id,
  });

  return project;
};

//********************************
// GET PROJECT OVERVIEW & KPIS
//********************************
export const getProjectOverviewService = async (
  workspaceId: string,
  projectId: string,
) => {
  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  })
    .populate("team", "_id name slug description status")
    .populate("teams", "_id name slug description status")
    .populate("createdBy", "_id name profilePicture email");

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace",
    );
  }

  // 1. Find Project HEAD
  const headAssociation = await AssociationModel.findOne({
    workspaceId,
    scopeType: AssociationScope.PROJECT,
    scopeId: project._id,
    role: AssociationRoles.HEAD,
    status: AssociationStatus.ACTIVE,
  }).populate({
    path: "memberId",
    populate: [
      { path: "userId", select: "name email profilePicture" },
      { path: "role", select: "name" },
    ],
  });

  // 2. Task metrics aggregation
  const currentDate = new Date();
  const taskStats = await TaskModel.aggregate([
    {
      $match: {
        project: new mongoose.Types.ObjectId(projectId),
        workspace: new mongoose.Types.ObjectId(workspaceId),
      },
    },
    {
      $facet: {
        totalTasks: [{ $count: "count" }],
        completedTasks: [
          { $match: { status: TaskStatusEnum.DONE } },
          { $count: "count" },
        ],
        inProgressTasks: [
          { $match: { status: TaskStatusEnum.IN_PROGRESS } },
          { $count: "count" },
        ],
        todoTasks: [
          {
            $match: {
              status: { $in: [TaskStatusEnum.TODO, TaskStatusEnum.BACKLOG] },
            },
          },
          { $count: "count" },
        ],
        inReviewTasks: [
          { $match: { status: TaskStatusEnum.IN_REVIEW } },
          { $count: "count" },
        ],
        overdueTasks: [
          {
            $match: {
              status: { $ne: TaskStatusEnum.DONE },
              dueDate: { $ne: null, $lt: currentDate },
            },
          },
          { $count: "count" },
        ],
      },
    },
  ]);

  const raw = taskStats[0];
  const totalTasks = raw.totalTasks[0]?.count || 0;
  const completedTasks = raw.completedTasks[0]?.count || 0;
  const inProgressTasks = raw.inProgressTasks[0]?.count || 0;
  const todoTasks = raw.todoTasks[0]?.count || 0;
  const inReviewTasks = raw.inReviewTasks[0]?.count || 0;
  const overdueTasks = raw.overdueTasks[0]?.count || 0;
  const pendingTasks = totalTasks - completedTasks;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 3. Determine assigned team count (all assigned teams to this project)
  const assignedTeamIds = new Set<string>();
  if (project.team) {
    assignedTeamIds.add(((project.team as any)._id || project.team).toString());
  }
  if ((project as any).teams && Array.isArray((project as any).teams)) {
    (project as any).teams.forEach((t: any) => {
      const id = t?._id ? t._id.toString() : t.toString();
      if (id) assignedTeamIds.add(id);
    });
  }
  const totalTeams = assignedTeamIds.size;

  // 4. Count unique project members (direct project members + members in assigned teams)
  const directProjectAssocs = await AssociationModel.find({
    workspaceId,
    scopeType: AssociationScope.PROJECT,
    scopeId: project._id,
    status: AssociationStatus.ACTIVE,
  }).select("memberId");

  const uniqueProjectMemberIds = new Set<string>();
  directProjectAssocs.forEach((a) => {
    if (a.memberId) uniqueProjectMemberIds.add(a.memberId.toString());
  });

  if (assignedTeamIds.size > 0) {
    const teamAssocs = await AssociationModel.find({
      workspaceId,
      scopeType: AssociationScope.TEAM,
      scopeId: {
        $in: Array.from(assignedTeamIds).map(
          (id) => new mongoose.Types.ObjectId(id)
        ),
      },
      status: AssociationStatus.ACTIVE,
    }).select("memberId");

    teamAssocs.forEach((ta) => {
      if (ta.memberId) uniqueProjectMemberIds.add(ta.memberId.toString());
    });
  }

  const totalMembers = uniqueProjectMemberIds.size;

  const headMember = headAssociation?.memberId as any;

  return {
    project,
    head: headMember
      ? {
          memberId: headMember._id,
          user: headMember.userId,
          workspaceRole: headMember.role?.name || "Member",
          role: headAssociation?.role || "HEAD",
        }
      : {
          user: project.createdBy,
          role: "HEAD",
        },
    kpis: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      inReviewTasks,
      pendingTasks,
      overdueTasks,
      totalMembers,
      totalTeams,
      progressPercentage,
    },
  };
};

//********************************
// GET PROJECT TEAMS & TEAM KPIS
//********************************
export const getProjectTeamsService = async (
  workspaceId: string,
  projectId: string,
) => {
  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  });

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace",
    );
  }

  // 1. Collect all assigned team IDs for this project
  const assignedTeamIds = new Set<string>();
  if (project.team) {
    assignedTeamIds.add(project.team.toString());
  }
  if (project.teams && Array.isArray(project.teams)) {
    project.teams.forEach((t) => {
      const id = (t as any)?._id ? (t as any)._id.toString() : t.toString();
      if (id) assignedTeamIds.add(id);
    });
  }

  if (assignedTeamIds.size === 0) {
    return { teams: [] };
  }

  const teamDocs = await TeamModel.find({
    _id: { $in: Array.from(assignedTeamIds).map((id) => new mongoose.Types.ObjectId(id)) },
    workspaceId,
  }).lean();

  if (!teamDocs || teamDocs.length === 0) {
    return { teams: [] };
  }

  const projectAssocs = await AssociationModel.find({
    workspaceId,
    scopeType: AssociationScope.PROJECT,
    scopeId: project._id,
    status: AssociationStatus.ACTIVE,
  }).select("memberId role");

  const projectMemberMap = new Map<string, AssociationRoleType>();
  projectAssocs.forEach((a) => {
    projectMemberMap.set(a.memberId.toString(), a.role);
  });

  // Total project tasks for calculating workload distribution
  const projectTotalTasks = await TaskModel.countDocuments({
    project: project._id,
    workspace: workspaceId,
  });

  // 2. Build detailed stats for each team
  const teamsWithStats = await Promise.all(
    teamDocs.map(async (team) => {
      // Find all team associations
      const teamAssocs = await AssociationModel.find({
        workspaceId,
        scopeType: AssociationScope.TEAM,
        scopeId: team._id,
        status: AssociationStatus.ACTIVE,
      }).populate({
        path: "memberId",
        populate: [
          { path: "userId", select: "name email profilePicture" },
          { path: "role", select: "name" },
        ],
      });

      // Identify HEAD and LEAD
      const headAssoc = teamAssocs.find((a) => a.role === AssociationRoles.HEAD);
      const leadAssoc = teamAssocs.find((a) => a.role === AssociationRoles.LEAD);

      const headUser = (headAssoc?.memberId as any)?.userId;
      const leadUser = (leadAssoc?.memberId as any)?.userId;

      // Collect user IDs in this team
      const teamUserIds: mongoose.Types.ObjectId[] = [];
      const teamProjectMembers: any[] = [];

      teamAssocs.forEach((ta) => {
        const mem = ta.memberId as any;
        if (mem?.userId?._id) {
          teamUserIds.push(mem.userId._id);
          // Check if this member is also involved in the current project
          const isProjectMember = projectMemberMap.has(mem._id.toString());
          if (isProjectMember || assignedTeamIds.has(team._id.toString())) {
            teamProjectMembers.push({
              memberId: mem._id,
              user: mem.userId,
              workspaceRole: mem.role?.name || "Member",
              teamRole: ta.role,
              projectRole: projectMemberMap.get(mem._id.toString()) || null,
            });
          }
        }
      });

      // Tasks in this project assigned to members of this team
      const teamTasksCount = await TaskModel.aggregate([
        {
          $match: {
            project: project._id,
            workspace: new mongoose.Types.ObjectId(workspaceId),
            assignedTo: { $in: teamUserIds },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", TaskStatusEnum.DONE] }, 1, 0] },
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ["$status", TaskStatusEnum.IN_PROGRESS] }, 1, 0] },
            },
          },
        },
      ]);

      const tStats = teamTasksCount[0] || { total: 0, completed: 0, inProgress: 0 };
      const teamTotalTasks = tStats.total;
      const teamCompletedTasks = tStats.completed;
      const teamPendingTasks = teamTotalTasks - teamCompletedTasks;
      const completionPercentage =
        teamTotalTasks > 0 ? Math.round((teamCompletedTasks / teamTotalTasks) * 100) : 0;
      const workloadDistribution =
        projectTotalTasks > 0 ? Math.round((teamTotalTasks / projectTotalTasks) * 100) : 0;

      // Compute task count for each member in this project
      const membersWithTaskCount = await Promise.all(
        teamProjectMembers.map(async (m) => {
          const count = await TaskModel.countDocuments({
            project: project._id,
            workspace: workspaceId,
            assignedTo: m.user._id,
          });
          return {
            ...m,
            taskCount: count,
          };
        }),
      );

      return {
        _id: team._id,
        name: team.name,
        slug: team.slug,
        description: team.description,
        status: team.status,
        head: headUser
          ? {
              _id: headUser._id,
              name: headUser.name,
              email: headUser.email,
              profilePicture: headUser.profilePicture,
            }
          : null,
        lead: leadUser
          ? {
              _id: leadUser._id,
              name: leadUser.name,
              email: leadUser.email,
              profilePicture: leadUser.profilePicture,
            }
          : null,
        totalMembers: teamAssocs.length,
        members: membersWithTaskCount,
        totalTasks: teamTotalTasks,
        completedTasks: teamCompletedTasks,
        pendingTasks: teamPendingTasks,
        completionPercentage,
        workloadDistribution,
      };
    }),
  );

  return { teams: teamsWithStats };
};

//********************************
// GET UNIQUE PROJECT MEMBERS & KPIS
//********************************
export const getProjectMembersService = async (
  workspaceId: string,
  projectId: string,
) => {
  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  });

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace",
    );
  }

  // 1. Collect all assigned team IDs for this project
  const assignedTeamIds: mongoose.Types.ObjectId[] = [];
  if (project.team) {
    assignedTeamIds.push(new mongoose.Types.ObjectId(project.team.toString()));
  }
  if (project.teams && Array.isArray(project.teams)) {
    project.teams.forEach((t) => {
      const id = (t as any)?._id || t;
      if (id) assignedTeamIds.push(new mongoose.Types.ObjectId(id.toString()));
    });
  }

  // 2. Fetch all direct active associations for this project
  const projectAssocs = await AssociationModel.find({
    workspaceId,
    scopeType: AssociationScope.PROJECT,
    scopeId: project._id,
    status: AssociationStatus.ACTIVE,
  }).populate({
    path: "memberId",
    populate: [
      { path: "userId", select: "name email profilePicture" },
      { path: "role", select: "name" },
    ],
  });

  // 3. Fetch active associations for all teams assigned to this project
  let teamAssocs: any[] = [];
  if (assignedTeamIds.length > 0) {
    teamAssocs = await AssociationModel.find({
      workspaceId,
      scopeType: AssociationScope.TEAM,
      scopeId: { $in: assignedTeamIds },
      status: AssociationStatus.ACTIVE,
    })
      .populate({
        path: "memberId",
        populate: [
          { path: "userId", select: "name email profilePicture" },
          { path: "role", select: "name" },
        ],
      })
      .populate("scopeId", "name slug description status");
  }

  // 4. Map member teams
  const memberTeamsMap = new Map<string, any[]>();
  teamAssocs.forEach((ta) => {
    const memId = ta.memberId?._id?.toString();
    const teamDoc = ta.scopeId as any;
    if (memId && teamDoc) {
      const existing = memberTeamsMap.get(memId) || [];
      if (!existing.some((t: any) => t._id?.toString() === teamDoc._id?.toString())) {
        existing.push({
          _id: teamDoc._id,
          name: teamDoc.name,
          slug: teamDoc.slug,
          role: ta.role,
        });
      }
      memberTeamsMap.set(memId, existing);
    }
  });

  // Also collect workspace team memberships for direct project members
  const directMemberIds = projectAssocs
    .map((a) => a.memberId?._id)
    .filter(Boolean);
  if (directMemberIds.length > 0) {
    const additionalTeamAssocs = await AssociationModel.find({
      workspaceId,
      scopeType: AssociationScope.TEAM,
      memberId: { $in: directMemberIds },
      status: AssociationStatus.ACTIVE,
    }).populate("scopeId", "name slug description status");

    additionalTeamAssocs.forEach((ta) => {
      const memId = ta.memberId?.toString();
      const teamDoc = ta.scopeId as any;
      if (memId && teamDoc) {
        const existing = memberTeamsMap.get(memId) || [];
        if (!existing.some((t: any) => t._id?.toString() === teamDoc._id?.toString())) {
          existing.push({
            _id: teamDoc._id,
            name: teamDoc.name,
            slug: teamDoc.slug,
            role: ta.role,
          });
        }
        memberTeamsMap.set(memId, existing);
      }
    });
  }

  // 5. Combine into unique members map
  const uniqueMemberMap = new Map<
    string,
    {
      associationId: any;
      member: any;
      projectRole: AssociationRoleType;
      joinedAt: Date | undefined;
    }
  >();

  // Add direct project members first (their direct project role takes precedence)
  projectAssocs.forEach((assoc) => {
    const mem = assoc.memberId as any;
    if (mem?._id) {
      uniqueMemberMap.set(mem._id.toString(), {
        associationId: assoc._id,
        member: mem,
        projectRole: assoc.role as AssociationRoleType,
        joinedAt: assoc.joinedAt || assoc.createdAt || undefined,
      });
    }
  });

  // Add members from assigned teams (if not already directly joined)
  teamAssocs.forEach((ta) => {
    const mem = ta.memberId as any;
    if (mem?._id && !uniqueMemberMap.has(mem._id.toString())) {
      uniqueMemberMap.set(mem._id.toString(), {
        associationId: ta._id,
        member: mem,
        projectRole: ta.role as AssociationRoleType,
        joinedAt: ta.joinedAt || ta.createdAt || undefined,
      });
    }
  });

  // 6. Aggregate member task stats in this project
  const userIds: mongoose.Types.ObjectId[] = [];
  uniqueMemberMap.forEach(({ member }) => {
    if (member?.userId?._id) {
      userIds.push(new mongoose.Types.ObjectId(member.userId._id.toString()));
    }
  });

  const currentDate = new Date();
  const taskStats = await TaskModel.aggregate([
    {
      $match: {
        project: new mongoose.Types.ObjectId(projectId),
        workspace: new mongoose.Types.ObjectId(workspaceId),
        assignedTo: { $in: userIds },
      },
    },
    {
      $group: {
        _id: "$assignedTo",
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", TaskStatusEnum.DONE] }, 1, 0] },
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ["$status", TaskStatusEnum.IN_PROGRESS] }, 1, 0] },
        },
        pending: {
          $sum: {
            $cond: [
              { $in: ["$status", [TaskStatusEnum.TODO, TaskStatusEnum.BACKLOG]] },
              1,
              0,
            ],
          },
        },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$status", TaskStatusEnum.DONE] },
                  { $ne: ["$dueDate", null] },
                  { $lt: ["$dueDate", currentDate] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const userStatsMap = new Map<string, any>();
  taskStats.forEach((ts) => {
    if (ts._id) {
      userStatsMap.set(ts._id.toString(), ts);
    }
  });

  // 7. Construct unique members array
  const members = Array.from(uniqueMemberMap.values()).map(
    ({ associationId, member: mem, projectRole, joinedAt }) => {
      const u = mem?.userId || {};
      const uId = u._id ? u._id.toString() : "";
      const stats = userStatsMap.get(uId) || {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0,
      };

      const completionPercentage =
        stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

      return {
        associationId,
        memberId: mem?._id,
        user: {
          _id: u._id,
          name: u.name || "Unknown",
          email: u.email || "",
          profilePicture: u.profilePicture || null,
        },
        workspaceRole: mem?.role?.name || "Member",
        projectRole,
        teams: memberTeamsMap.get(mem?._id?.toString()) || [],
        totalAssignedTasks: stats.total,
        completedTasks: stats.completed,
        inProgressTasks: stats.inProgress,
        pendingTasks: stats.pending,
        overdueTasks: stats.overdue,
        completionPercentage,
        joinedAt,
      };
    }
  );

  // Sort: HEAD first, then LEAD, then MEMBER, then by task count descending
  const rolePriority: Record<string, number> = {
    HEAD: 1,
    LEAD: 2,
    MEMBER: 3,
  };

  members.sort((a, b) => {
    const pA = rolePriority[a.projectRole] || 4;
    const pB = rolePriority[b.projectRole] || 4;
    if (pA !== pB) return pA - pB;
    return b.totalAssignedTasks - a.totalAssignedTasks;
  });

  return { members };
};

//********************************
// GET MEMBER TASKS IN PROJECT
//********************************
export const getProjectMemberTasksService = async (
  workspaceId: string,
  projectId: string,
  userId: string,
) => {
  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  });

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace",
    );
  }

  const tasks = await TaskModel.find({
    project: projectId,
    workspace: workspaceId,
    assignedTo: userId,
  })
    .populate("assignedTo", "name email profilePicture")
    .populate({
      path: "project",
      select: "name emoji team",
      populate: {
        path: "team",
        select: "name slug",
      },
    })
    .sort({ createdAt: -1 });

  const currentDate = new Date();
  let completed = 0;
  let inProgress = 0;
  let pending = 0;
  let overdue = 0;

  tasks.forEach((t) => {
    if (t.status === TaskStatusEnum.DONE) {
      completed++;
    } else {
      if (t.status === TaskStatusEnum.IN_PROGRESS) inProgress++;
      else pending++;

      if (t.dueDate && new Date(t.dueDate) < currentDate) {
        overdue++;
      }
    }
  });

  const total = tasks.length;
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    tasks,
    kpis: {
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: inProgress,
      pendingTasks: pending,
      overdueTasks: overdue,
      completionPercentage,
    },
  };
};
