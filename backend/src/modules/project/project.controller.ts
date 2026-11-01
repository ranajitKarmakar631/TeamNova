import { Request, Response } from "express";
import { asyncHandler } from "../../common/middlewares/asyncHandler.middleware";
import {
  assignTeamsSchema,
  createProjectSchema,
  projectIdSchema,
  teamIdParamSchema,
  updateProjectSchema,
} from "./project.validation";
import { workspaceIdSchema } from "../workspace/workspace.validation";
import { getMemberRoleInWorkspace } from "../member/member.service";
import { roleGuard } from "../../common/utils/roleGuard";
import { Permissions, AssociationScope } from "../../common/enums/association.enum";
import {
  assignTeamsToProjectService,
  createProjectService,
  deleteProjectService,
  getProjectAnalyticsService,
  getProjectByIdAndWorkspaceIdService,
  getProjectMembersService,
  getProjectMemberTasksService,
  getProjectOverviewService,
  getProjectsByTeamService,
  getProjectsInWorkspaceService,
  getProjectTeamsService,
  removeTeamFromProjectService,
  updateProjectService,
} from "./project.service";
import { getAvailableScopeMembersService } from "../association/association.service";
import { HTTPSTATUS } from "../../config/http.config";

export const createProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = createProjectSchema.parse(req.body);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const userId = req.user?._id;
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.PROJECT_CREATE]);

    const { project } = await createProjectService(userId, workspaceId, body);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Project created successfully",
      project,
    });
  }
);

export const getAllProjectsInWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.PROJECT_READ]);

    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const keyword = req.query.keyword as string | undefined;

    const { projects, totalCount, totalPages, skip } =
      await getProjectsInWorkspaceService(
        workspaceId,
        pageSize,
        pageNumber,
        keyword
      );

    return res.status(HTTPSTATUS.OK).json({
      message: "Project fetched successfully",
      projects,
      pagination: {
        totalCount,
        pageSize,
        pageNumber,
        totalPages,
        skip,
        limit: pageSize,
      },
    });
  }
);

export const getProjectsByTeamController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const teamId = projectIdSchema.parse(req.params.teamId);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.PROJECT_READ]);

    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;

    const { projects, totalCount, totalPages, skip } =
      await getProjectsByTeamService(workspaceId, teamId, pageSize, pageNumber);

    return res.status(HTTPSTATUS.OK).json({
      message: "Projects for team fetched successfully",
      projects,
      pagination: {
        totalCount,
        pageSize,
        pageNumber,
        totalPages,
        skip,
        limit: pageSize,
      },
    });
  }
);

export const getProjectByIdAndWorkspaceIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(
      req.params.projectId || req.params.id
    );
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.PROJECT_READ]);

    const { project } = await getProjectByIdAndWorkspaceIdService(
      workspaceId,
      projectId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Project fetched successfully",
      project,
    });
  }
);

export const getProjectAnalyticsController = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(
      req.params.projectId || req.params.id
    );
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.PROJECT_READ]);

    const { analytics } = await getProjectAnalyticsService(
      workspaceId,
      projectId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Project analytics retrieved successfully",
      analytics,
    });
  }
);

export const updateProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const projectId = projectIdSchema.parse(
      req.params.projectId || req.params.id
    );
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const body = updateProjectSchema.parse(req.body);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.PROJECT_UPDATE]);

    const { project } = await updateProjectService(
      workspaceId,
      projectId,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Project updated successfully",
      project,
    });
  }
);

export const deleteProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const projectId = projectIdSchema.parse(
      req.params.projectId || req.params.id
    );
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.PROJECT_DELETE]);

    await deleteProjectService(workspaceId, projectId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Project deleted successfully",
    });
  }
);

export const getProjectOverviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(
      req.params.projectId || req.params.id
    );
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.PROJECT_READ]);

    const data = await getProjectOverviewService(workspaceId, projectId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Project overview retrieved successfully",
      ...data,
    });
  }
);

export const getProjectTeamsController = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(
      req.params.projectId || req.params.id
    );
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.PROJECT_READ]);

    const data = await getProjectTeamsService(workspaceId, projectId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Project teams retrieved successfully",
      ...data,
    });
  }
);

export const getProjectMembersController = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(
      req.params.projectId || req.params.id
    );
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.PROJECT_READ]);

    const data = await getProjectMembersService(workspaceId, projectId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Project members retrieved successfully",
      ...data,
    });
  }
);

export const getProjectMemberTasksController = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(
      req.params.projectId || req.params.id
    );
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const targetUserId = req.params.userId;
    const currentUserId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(currentUserId, workspaceId);
    roleGuard(role, [Permissions.PROJECT_READ]);

    const data = await getProjectMemberTasksService(
      workspaceId,
      projectId,
      targetUserId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Member project tasks retrieved successfully",
      ...data,
    });
  }
);

export const assignTeamsToProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(
      req.params.projectId || req.params.id
    );
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const { teamIds } = assignTeamsSchema.parse(req.body);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.PROJECT_UPDATE]);

    const { project } = await assignTeamsToProjectService(
      workspaceId,
      projectId,
      teamIds
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Teams assigned to project successfully",
      project,
    });
  }
);

export const removeTeamFromProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(
      req.params.projectId || req.params.id
    );
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const teamId = teamIdParamSchema.parse(req.params.teamId);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.PROJECT_UPDATE]);

    const { project } = await removeTeamFromProjectService(
      workspaceId,
      projectId,
      teamId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Team removed from project successfully",
      project,
    });
  }
);

export const getAvailableProjectMembersController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const projectId = projectIdSchema.parse(
      req.params.projectId || req.params.id
    );
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const search = req.query.search as string | undefined;

    const result = await getAvailableScopeMembersService(
      currentUserId,
      workspaceId,
      AssociationScope.PROJECT,
      projectId,
      search
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Available project members retrieved successfully",
      ...result,
    });
  }
);
