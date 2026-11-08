import { Router } from "express";
import {
  changeWorkspaceMemberRoleController,
  createWorkspaceController,
  deleteWorkspaceByIdController,
  deleteWorkspaceMemberController,
  getAllWorkspacesUserIsMemberController,
  getWorkspaceAnalyticsController,
  getWorkspaceByIdController,
  getWorkspaceMembersController,
  updateWorkspaceByIdController,
} from "./workspace.controller";

const workspaceRoutes = Router();

// Workspace collection
workspaceRoutes.post("/", createWorkspaceController);
workspaceRoutes.post("/create/new", createWorkspaceController);
workspaceRoutes.get("/", getAllWorkspacesUserIsMemberController);
workspaceRoutes.get("/all", getAllWorkspacesUserIsMemberController);

// Workspace sub-resources
workspaceRoutes.get("/:workspaceId/members", getWorkspaceMembersController);
workspaceRoutes.get("/members/:workspaceId", getWorkspaceMembersController);
workspaceRoutes.patch("/:workspaceId/members/role", changeWorkspaceMemberRoleController);
workspaceRoutes.put("/:workspaceId/members/role", changeWorkspaceMemberRoleController);
workspaceRoutes.put("/change/member/role/:workspaceId", changeWorkspaceMemberRoleController);
workspaceRoutes.delete("/:workspaceId/members/:memberId", deleteWorkspaceMemberController);
workspaceRoutes.delete("/members/:workspaceId/:memberId", deleteWorkspaceMemberController);
workspaceRoutes.delete("/:workspaceId/members", deleteWorkspaceMemberController);
workspaceRoutes.get("/:workspaceId/analytics", getWorkspaceAnalyticsController);
workspaceRoutes.get("/analytics/:workspaceId", getWorkspaceAnalyticsController);

// Workspace item operations
workspaceRoutes.get("/:workspaceId", getWorkspaceByIdController);
workspaceRoutes.put("/update/:workspaceId", updateWorkspaceByIdController);
workspaceRoutes.patch("/:workspaceId", updateWorkspaceByIdController);
workspaceRoutes.put("/:workspaceId", updateWorkspaceByIdController);
workspaceRoutes.delete("/delete/:workspaceId", deleteWorkspaceByIdController);
workspaceRoutes.delete("/:workspaceId", deleteWorkspaceByIdController);

export default workspaceRoutes;
