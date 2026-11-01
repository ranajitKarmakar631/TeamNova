import { AppError } from "../../common/utils/appError";
import { WorkspaceModel } from "../workspace";
import TeamModel, { TeamStatus } from "./teams.model";
import ProjectModel from "../project/project.model";
import AssociationModel, {
  AssociationStatus,
} from "../association/association.model";
import {
  AssociationRoles,
  AssociationRoleType,
  AssociationScope,
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
    description?: string,
    status: TeamStatus = "ACTIVE",
    members?: Array<{
      memberId?: string;
      userId?: string;
      role?: AssociationRoleType;
    }>
  ) => {
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new AppError("Workspace not found", 404);
    }

    const existingTeam = await this.model.findOne({ workspaceId, name: name.trim() });
    if (existingTeam) {
      throw new AppError("Team with this name already exists in this workspace", 400);
    }

    const team = await this.model.create({
      name: name.trim(),
      workspaceId,
      createdBy: userId,
      description: description?.trim() || null,
      status,
    });

    // NOTE: The creator is not automatically associated with the team.
    // They will only have an association if they join or explicitly add themselves.

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
    },
    pagination: {
      pageSize: number;
      pageNumber: number;
    }
  ) => {
    const query: Record<string, any> = {
      workspaceId,
    };

    if (filters.status && filters.status.length > 0) {
      query.status = { $in: filters.status };
    }

    if (filters.keyword && filters.keyword.trim() !== "") {
      const keywordRegex = { $regex: filters.keyword.trim(), $options: "i" };
      query.$or = [{ name: keywordRegex }, { description: keywordRegex }];
    }

    const pageSize = pagination.pageSize || 10;
    const pageNumber = pagination.pageNumber || 1;
    const skip = (pageNumber - 1) * pageSize;

    const [totalCount, rawTeams] = await Promise.all([
      this.model.countDocuments(query),
      this.model
        .find(query)
        .populate("createdBy", "_id name email profilePicture")
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

  getTeam = async (teamId: string, workspaceId?: string) => {
    const query: Record<string, any> = { _id: teamId };
    if (workspaceId) query.workspaceId = workspaceId;

    const team = await this.model
      .findOne(query)
      .populate("createdBy", "_id name email profilePicture")
      .lean();

    if (!team) {
      throw new AppError("Team not found", 404);
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
    // Prevent deleting a team that still has projects assigned to it
    const activeProjectsCount = await ProjectModel.countDocuments({
      workspace: workspaceId,
      $or: [{ team: teamId }, { teams: teamId }],
    });

    if (activeProjectsCount > 0) {
      throw new AppError(
        `Cannot delete this team because it still owns ${activeProjectsCount} project(s). Reassign or delete the projects first.`,
        400
      );
    }

    const team = await this.model.findOneAndDelete({ _id: teamId, workspaceId });
    if (!team) {
      throw new AppError("Team not found", 404);
    }

    // Cascade delete any associations for this team
    await AssociationModel.deleteMany({
      scopeType: "TEAM",
      scopeId: team._id,
    });

    return team;
  };
}
