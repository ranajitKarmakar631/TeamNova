import { Router } from "express";
import {
  assignTeamsToProjectController,
  createProjectController,
  deleteProjectController,
  getAllProjectsInWorkspaceController,
  getAvailableProjectMembersController,
  getProjectAnalyticsController,
  getProjectByIdAndWorkspaceIdController,
  getProjectMembersController,
  getProjectMemberTasksController,
  getProjectOverviewController,
  getProjectsByTeamController,
  getProjectTeamsController,
  removeTeamFromProjectController,
  updateProjectController,
} from "./project.controller";

const projectRoutes = Router();

// Workspace-scoped project collection
projectRoutes.post("/workspaces/:workspaceId", createProjectController);
projectRoutes.post("/workspace/:workspaceId/create", createProjectController);
projectRoutes.get("/workspaces/:workspaceId", getAllProjectsInWorkspaceController);
projectRoutes.get("/workspace/:workspaceId/all", getAllProjectsInWorkspaceController);
projectRoutes.get(
  "/workspaces/:workspaceId/teams/:teamId",
  getProjectsByTeamController
);
projectRoutes.get(
  "/workspace/:workspaceId/team/:teamId",
  getProjectsByTeamController
);

// Project sub-resources
projectRoutes.get(
  "/:projectId/workspaces/:workspaceId/analytics",
  getProjectAnalyticsController
);
projectRoutes.get(
  "/:projectId/workspace/:workspaceId/analytics",
  getProjectAnalyticsController
);
projectRoutes.get(
  "/:projectId/workspaces/:workspaceId/overview",
  getProjectOverviewController
);
projectRoutes.get(
  "/:projectId/workspace/:workspaceId/overview",
  getProjectOverviewController
);
projectRoutes.get(
  "/:projectId/workspaces/:workspaceId/teams",
  getProjectTeamsController
);
projectRoutes.get(
  "/:projectId/workspace/:workspaceId/teams",
  getProjectTeamsController
);
projectRoutes.post(
  "/:projectId/workspaces/:workspaceId/teams",
  assignTeamsToProjectController
);
projectRoutes.post(
  "/:projectId/workspace/:workspaceId/teams",
  assignTeamsToProjectController
);
projectRoutes.delete(
  "/:projectId/workspaces/:workspaceId/teams/:teamId",
  removeTeamFromProjectController
);
projectRoutes.delete(
  "/:projectId/workspace/:workspaceId/teams/:teamId",
  removeTeamFromProjectController
);
projectRoutes.get(
  "/:projectId/workspaces/:workspaceId/members",
  getProjectMembersController
);
projectRoutes.get(
  "/:projectId/workspace/:workspaceId/members",
  getProjectMembersController
);
projectRoutes.get(
  "/:projectId/workspaces/:workspaceId/available-members",
  getAvailableProjectMembersController
);
projectRoutes.get(
  "/:projectId/workspace/:workspaceId/available-members",
  getAvailableProjectMembersController
);
projectRoutes.get(
  "/:projectId/workspaces/:workspaceId/members/:userId/tasks",
  getProjectMemberTasksController
);
projectRoutes.get(
  "/:projectId/workspace/:workspaceId/member/:userId/tasks",
  getProjectMemberTasksController
);

// Single project item operations
projectRoutes.get(
  "/:projectId/workspaces/:workspaceId",
  getProjectByIdAndWorkspaceIdController
);
projectRoutes.get(
  "/:projectId/workspace/:workspaceId",
  getProjectByIdAndWorkspaceIdController
);
projectRoutes.patch(
  "/:projectId/workspaces/:workspaceId",
  updateProjectController
);
projectRoutes.put(
  "/:projectId/workspaces/:workspaceId",
  updateProjectController
);
projectRoutes.put(
  "/:projectId/workspace/:workspaceId/update",
  updateProjectController
);
projectRoutes.delete(
  "/:projectId/workspaces/:workspaceId",
  deleteProjectController
);
projectRoutes.delete(
  "/:projectId/workspace/:workspaceId/delete",
  deleteProjectController
);
projectRoutes.delete(
  "/:projectId/workspaces/:workspaceId",
  deleteProjectController
);

export default projectRoutes;
