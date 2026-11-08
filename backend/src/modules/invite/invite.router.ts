import { Router } from "express";
import isAuthenticated from "../../common/middlewares/isAuthenticated.middleware";
import {
  acceptInviteController,
  createWorkspaceEmailController,
  createWorkspaceLinkController,
  getInviteDetailsController,
  getWorkspaceInvitationsController,
  revokeInviteController,
} from "./invite.controller";

const inviteRouter = Router();

// Public route to inspect invitation preview (e.g. before logging in or accepting)
inviteRouter.get("/details/:token", getInviteDetailsController);
inviteRouter.get("/:token", getInviteDetailsController);

// Authenticated routes
inviteRouter.post("/link", isAuthenticated, createWorkspaceLinkController);
inviteRouter.post(
  "/workspace/:workspaceId/link",
  isAuthenticated,
  createWorkspaceLinkController
);
inviteRouter.post(
  "/workspaces/:workspaceId/link",
  isAuthenticated,
  createWorkspaceLinkController
);

inviteRouter.post("/email", isAuthenticated, createWorkspaceEmailController);
inviteRouter.post(
  "/workspace/:workspaceId/email",
  isAuthenticated,
  createWorkspaceEmailController
);
inviteRouter.post(
  "/workspaces/:workspaceId/email",
  isAuthenticated,
  createWorkspaceEmailController
);

inviteRouter.post("/accept", isAuthenticated, acceptInviteController);
inviteRouter.get(
  "/workspaces/:workspaceId",
  isAuthenticated,
  getWorkspaceInvitationsController
);
inviteRouter.get(
  "/workspace/:workspaceId/all",
  isAuthenticated,
  getWorkspaceInvitationsController
);
inviteRouter.delete(
  "/workspaces/:workspaceId/:invitationId",
  isAuthenticated,
  revokeInviteController
);
inviteRouter.delete(
  "/workspace/:workspaceId/:invitationId",
  isAuthenticated,
  revokeInviteController
);

export default inviteRouter;
