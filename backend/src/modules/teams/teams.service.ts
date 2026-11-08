import { AppError } from "../../common/utils/appError";
import { WorkspaceModel } from "../workspace";
import TeamModel, { TeamStatus } from "./teams.model";
import ProjectModel from "../project/project.model";
import TaskModel from "../task/task.model";
import AssociationModel, {
  AssociationStatus,
} from "../association/association.model";
import {
  AssociationRoles,
  AssociationRoleType,
  AssociationScope,
  WorkspaceRoles,
} from "../../common/enums/association.enum";
import MemberModel from "../member/member.model";
import { resolveMember } from "../association/association.service";

export class TeamService {
  private model: typeof TeamModel;

  constructor() {
    this.model = TeamModel;
  }

  createTeam = async (
    name: string,
    workspaceId: string,
    userId: string,
    projectId: string,
    description?: string,
    status: TeamStatus = "ACTIVE",
    members?: Array<{
      memberId?: string;
      userId?: string;
      role?: AssociationRoleType;
    }>
  ) => {
    if (!projectId) {
      throw new AppError("Project ID is required. Teams must be created under a project.", 400);
    }

    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new AppError("Workspace not found", 404);
    }

    const project = await ProjectModel.findOne({ _id: projectId, workspace: workspaceId });
    if (!project) {
      throw new AppError("Project not found in this workspace", 404);
    }

    const existingTeam = await this.model.findOne({
      workspaceId,
      projectId,
      name: name.trim(),
    });
    if (existingTeam) {
      throw new AppError("Team with this name already exists in this project", 400);
    }

    // Check member duplicates if initial members provided:
    // No member should already be in the project (independently or in another team under this project)
    if (members && Array.isArray(members) && members.length > 0) {
      for (const memberItem of members) {
        const member = await resolveMember(workspaceId, memberItem.memberId, memberItem.userId);
        if (member) {
          // Check if already in project independently
          const directAssoc = await AssociationModel.findOne({
            memberId: member._id,
            workspaceId,
            scopeType: AssociationScope.PROJECT,
            scopeId: project._id,
            status: AssociationStatus.ACTIVE,
          });
          if (directAssoc) {
            throw new AppError(
              "Member is already assigned to this project independently. Duplicate memberships are not allowed.",
              400
            );
          }

          // Check if already in another team under this project
          const otherTeams = await this.model.find({
            workspaceId,
            projectId,
          }).select("_id");
          const otherTeamIds = otherTeams.map((t) => t._id);
          if (otherTeamIds.length > 0) {
            const teamAssoc = await AssociationModel.findOne({
              memberId: member._id,
              workspaceId,
              scopeType: AssociationScope.TEAM,
              scopeId: { $in: otherTeamIds },
              status: AssociationStatus.ACTIVE,
            });
            if (teamAssoc) {
              throw new AppError(
                "Member is already part of another team in this project. Duplicate memberships are not allowed.",
                400
              );
            }
          }
        }
      }
    }

    const team = await this.model.create({
      name: name.trim(),
      workspaceId,
      projectId: project._id,
      createdBy: userId,
      description: description?.trim() || null,
      status,
    });

    // Automatically link team to project's teams array
    await ProjectModel.findByIdAndUpdate(project._id, {
      $addToSet: { teams: team._id },
    });

    // 2. Associate initial members if provided
    if (members && Array.isArray(members) && members.length > 0) {
      for (const memberItem of members) {
        try {
          const member = await resolveMember(
            workspaceId,
            memberItem.memberId,
            memberItem.userId
          );
          if (member) {
            await AssociationModel.findOneAndUpdate(
              {
                memberId: member._id,
                workspaceId,
                scopeType: AssociationScope.TEAM,
                scopeId: team._id,
              },
              {
                $setOnInsert: {
                  memberId: member._id,
                  workspaceId,
                  scopeType: AssociationScope.TEAM,
                  scopeId: team._id,
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
          console.error("Failed to associate member during team creation:", err);
        }
      }
    }

    return team;
  };

  getAllTeams = async (
    workspaceId: string,
    filters: {
      keyword?: string;
      status?: string[];
      onlyMyTeams?: boolean;
      userId?: string;
      projectId?: string;
      userRole?: string;
    },
    pagination: {
      pageSize: number;
      pageNumber: number;
    }
  ) => {
    const query: Record<string, any> = {
      workspaceId,
    };

    if (filters.projectId) {
      query.projectId = filters.projectId;
    }

    if (filters.status && filters.status.length > 0) {
      query.status = { $in: filters.status };
    }

    if (filters.keyword && filters.keyword.trim() !== "") {
      const keywordRegex = { $regex: filters.keyword.trim(), $options: "i" };
      query.$or = [{ name: keywordRegex }, { description: keywordRegex }];
    }

    // Requirement 1: workspace members (EMPLOYEE) can only view their assigned teams
    const shouldFilterMyTeams =
      filters.onlyMyTeams || filters.userRole === WorkspaceRoles.EMPLOYEE;

    if (shouldFilterMyTeams && filters.userId) {
      const member = await MemberModel.findOne({
        workspaceId,
        userId: filters.userId,
      });

      if (member) {
        const teamAssocs = await AssociationModel.find({
          workspaceId,
          memberId: member._id,
          scopeType: AssociationScope.TEAM,
          status: AssociationStatus.ACTIVE,
        }).select("scopeId");

        const teamIds = teamAssocs.map((a) => a.scopeId);
        query.$or = [
          { _id: { $in: teamIds } },
          { createdBy: filters.userId },
        ];
      } else {
        query.createdBy = filters.userId;
      }
    }

    const pageSize = pagination.pageSize || 10;
    const pageNumber = pagination.pageNumber || 1;
    const skip = (pageNumber - 1) * pageSize;

    const [totalCount, rawTeams] = await Promise.all([
      this.model.countDocuments(query),
      this.model
        .find(query)
        .populate("createdBy", "_id name email profilePicture")
        .populate("projectId", "_id name emoji description")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    const teamIds = rawTeams.map((t) => t._id);

    // Aggregate member counts for these teams
    const counts = await AssociationModel.aggregate([
      {
        $match: {
          scopeType: "TEAM",
          scopeId: { $in: teamIds },
          status: "ACTIVE",
        },
      },
      {
        $group: {
          _id: "$scopeId",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map(
      counts.map((c) => [c._id.toString(), c.count])
    );

    const teams = rawTeams.map((team) => ({
      ...team,
      membersCount: countMap.get(team._id.toString()) || 0,
    }));

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      teams,
      pagination: {
        totalCount,
        pageSize,
        pageNumber,
        totalPages,
        skip,
        limit: pageSize,
      },
    };
  };

  getTeam = async (
    teamId: string,
    workspaceId?: string,
    userId?: string,
    userRole?: string
  ) => {
    const query: Record<string, any> = { _id: teamId };
    if (workspaceId) query.workspaceId = workspaceId;

    const team = await this.model
      .findOne(query)
      .populate("createdBy", "_id name email profilePicture")
      .populate("projectId", "_id name emoji description")
      .lean();

    if (!team) {
      throw new AppError("Team not found", 404);
    }

    // Requirement 1: workspace members (EMPLOYEE) can only view their assigned teams
    if (userRole === WorkspaceRoles.EMPLOYEE && userId) {
      const member = await MemberModel.findOne({
        workspaceId: team.workspaceId,
        userId,
      });

      if (!member) {
        throw new AppError("You do not have access to this team", 403);
      }

      const isAssoc = await AssociationModel.exists({
        memberId: member._id,
        workspaceId: team.workspaceId,
        scopeType: AssociationScope.TEAM,
        scopeId: team._id,
        status: AssociationStatus.ACTIVE,
      });

      if (!isAssoc && team.createdBy?._id?.toString() !== userId.toString()) {
        throw new AppError("You do not have access to this team", 403);
      }
    }

    const membersCount = await AssociationModel.countDocuments({
      scopeType: "TEAM",
      scopeId: team._id,
      status: "ACTIVE",
    });

    return { ...team, membersCount };
  };

  updateTeam = async (
    teamId: string,
    workspaceId: string,
    data: {
      name?: string;
      description?: string | null;
      status?: TeamStatus;
    }
  ) => {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;
    if (data.status !== undefined) updateData.status = data.status;

    const updatedTeam = await this.model
      .findOneAndUpdate(
        { _id: teamId, workspaceId },
        { $set: updateData },
        { new: true }
      )
      .populate("createdBy", "_id name email profilePicture");

    if (!updatedTeam) {
      throw new AppError("Team not found or update failed", 404);
    }

    return updatedTeam;
  };

  deleteTeam = async (teamId: string, workspaceId: string) => {
    const team = await this.model.findOneAndDelete({ _id: teamId, workspaceId });
    if (!team) {
      throw new AppError("Team not found", 404);
    }

    // Remove team from project's teams array
    if (team.projectId) {
      await ProjectModel.findByIdAndUpdate(team.projectId, {
        $pull: { teams: team._id },
      });
    }

    // Cascade delete any associations for this team
    await AssociationModel.deleteMany({
      scopeType: "TEAM",
      scopeId: team._id,
    });

    // Unassign tasks assigned to this team
    await TaskModel.updateMany(
      { workspace: workspaceId, team: team._id },
      { $set: { team: null } }
    );

    return team;
  };
}
