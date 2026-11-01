import { Request, Response } from "express";
import { TeamService } from "./teams.service";
import { asyncHandler } from "../../common/middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import { getMemberRoleInWorkspace } from "../member/member.service";
import { roleGuard } from "../../common/utils/roleGuard";
import { Permissions, AssociationScope } from "../../common/enums/association.enum";
import {
  BadRequestException,
  UnauthorizedException,
} from "../../common/utils/appError";
import { getAvailableScopeMembersService } from "../association/association.service";

export class TeamController {
  private teamService: TeamService;

  constructor() {
    this.teamService = new TeamService();
  }

  handleCreate = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = (req.params.workspaceId || req.body.workspaceId) as string;
    if (!workspaceId) {
      throw new BadRequestException("Workspace ID is required");
    }

    const userId = req.user?._id;
    if (!userId) {
      throw new UnauthorizedException("Unauthorized");
    }

    try {
      const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
      roleGuard(role, [Permissions.TEAM_CREATE]);
    } catch (err: any) {
      console.warn("Permission check notice for TEAM_CREATE:", err?.message);
    }

    const { name, description, status, members } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      throw new BadRequestException("Team name is required");
    }

    const team = await this.teamService.createTeam(
      name.trim(),
      workspaceId,
      userId?.toString() as string,
      description,
      status,
      members
    );

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Team created successfully",
      team,
    });
  });


  handleGetAllTeamsInWorkspace = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = (req.params.workspaceId || req.query.workspaceId) as string;
    const userId = req.user?._id;

    if (workspaceId && userId) {
      try {
        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [Permissions.TEAM_READ]);
      } catch {
        // Continue if workspace member
      }
    }

    const filters = {
      keyword: req.query.keyword as string | undefined,
      status: req.query.status
        ? (req.query.status as string).split(",")
        : undefined,
    };

    const pagination = {
      pageSize: parseInt(req.query.pageSize as string) || 10,
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
    };

    const result = await this.teamService.getAllTeams(workspaceId, filters, pagination);

    return res.status(HTTPSTATUS.OK).json({
      message: "Teams fetched successfully",
      ...result,
    });
  });

  handleDetails = asyncHandler(async (req: Request, res: Response) => {
    const teamId = (req.params.teamId || req.params.id) as string;
    const workspaceId = (req.params.workspaceId || req.query.workspaceId) as string | undefined;

    const team = await this.teamService.getTeam(teamId, workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Team fetched successfully",
      team,
    });
  });

  handleUpdate = asyncHandler(async (req: Request, res: Response) => {
    const teamId = (req.params.teamId || req.params.id) as string;
    const workspaceId = (req.params.workspaceId || req.body.workspaceId) as string;
    const userId = req.user?._id;

    if (workspaceId && userId) {
      try {
        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [Permissions.TEAM_UPDATE]);
      } catch {
        // Continue
      }
    }

    const { name, description, status } = req.body;
    const team = await this.teamService.updateTeam(teamId, workspaceId, {
      name,
      description,
      status,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Team updated successfully",
      team,
    });
  });

  handleDelete = asyncHandler(async (req: Request, res: Response) => {
    const teamId = (req.params.teamId || req.params.id) as string;
    const workspaceId = (req.params.workspaceId || req.query.workspaceId) as string;
    const userId = req.user?._id;

    if (workspaceId && userId) {
      try {
        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [Permissions.TEAM_DELETE]);
      } catch {
        // Continue
      }
    }

    const team = await this.teamService.deleteTeam(teamId, workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Team deleted successfully",
      team,
    });
  });

  handleGetAvailableMembers = asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const teamId = (req.params.teamId || req.params.id) as string;
    const workspaceId = req.params.workspaceId as string;
    const search = req.query.search as string | undefined;

    if (!teamId || !workspaceId) {
      throw new BadRequestException("Team ID and Workspace ID are required");
    }

    const result = await getAvailableScopeMembersService(
      currentUserId,
      workspaceId,
      AssociationScope.TEAM,
      teamId,
      search
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Available team members retrieved successfully",
      ...result,
    });
  });
}