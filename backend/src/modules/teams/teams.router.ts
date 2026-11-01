import { Router } from "express";
import { TeamController } from "./teams.conrolller";

const teamRoute = Router();
const teamController = new TeamController();

// Teams in workspace collection
teamRoute.get("/workspaces/:workspaceId", teamController.handleGetAllTeamsInWorkspace);
teamRoute.get("/workspace/:workspaceId/all", teamController.handleGetAllTeamsInWorkspace);
teamRoute.post("/workspaces/:workspaceId", teamController.handleCreate);
teamRoute.post("/workspace/:workspaceId/create", teamController.handleCreate);
teamRoute.post("/", teamController.handleCreate);

// Single team item operations
teamRoute.get("/:teamId/workspaces/:workspaceId", teamController.handleDetails);
teamRoute.get("/:teamId/workspace/:workspaceId", teamController.handleDetails);
teamRoute.get("/:id", teamController.handleDetails);
teamRoute.get(
  "/:teamId/workspaces/:workspaceId/available-members",
  teamController.handleGetAvailableMembers
);
teamRoute.get(
  "/:teamId/workspace/:workspaceId/available-members",
  teamController.handleGetAvailableMembers
);
teamRoute.patch("/:teamId/workspaces/:workspaceId", teamController.handleUpdate);
teamRoute.put("/:teamId/workspaces/:workspaceId", teamController.handleUpdate);
teamRoute.put("/:teamId/workspace/:workspaceId/update", teamController.handleUpdate);
teamRoute.patch("/:teamId/workspace/:workspaceId/update", teamController.handleUpdate);
teamRoute.put("/:id", teamController.handleUpdate);
teamRoute.delete("/:teamId/workspaces/:workspaceId", teamController.handleDelete);
teamRoute.delete("/:teamId/workspace/:workspaceId/delete", teamController.handleDelete);
teamRoute.delete("/:id", teamController.handleDelete);

export default teamRoute;
