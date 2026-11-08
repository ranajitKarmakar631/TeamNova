import { Router } from "express";
import {
  assignMemberController,
  deleteAssociationPermanentlyController,
  getAssociationByIdController,
  getAvailableScopeMembersController,
  getMyAssociationsController,
  getScopeMembersController,
  getUserAssociationsController,
  removeMemberController,
  updateAssociationByIdController,
  updateMemberRoleController,
} from "./association.controller";

const associationRoutes = Router();

// Assign member to scope (POST /)
associationRoutes.post("/", assignMemberController);
associationRoutes.post("/assign", assignMemberController);

// Update member role in scope (PATCH /role, PUT /role)
associationRoutes.patch("/role", updateMemberRoleController);
associationRoutes.put("/role", updateMemberRoleController);

// Remove member from scope (DELETE /, POST /remove)
associationRoutes.delete("/", removeMemberController);
associationRoutes.post("/remove", removeMemberController);

// Current user's associations across teams and projects
associationRoutes.get("/my-associations", getMyAssociationsController);

// Members of a specific scope (scopeType = TEAM | PROJECT)
associationRoutes.get("/members", getScopeMembersController);
associationRoutes.get("/scopes/:scopeType/:scopeId", getScopeMembersController);
associationRoutes.get("/scope/:scopeType/:scopeId", getScopeMembersController);

// Available members eligible to join scope (scopeType = TEAM | PROJECT)
associationRoutes.get("/available-members", getAvailableScopeMembersController);
associationRoutes.get(
  "/scopes/:scopeType/:scopeId/available-members",
  getAvailableScopeMembersController
);
associationRoutes.get(
  "/scope/:scopeType/:scopeId/available-members",
  getAvailableScopeMembersController
);

// User's associations in workspace
associationRoutes.get("/users/:userId", getUserAssociationsController);
associationRoutes.get("/user/:userId", getUserAssociationsController);

// Association by ID operations
associationRoutes.get("/:id", getAssociationByIdController);
associationRoutes.patch("/:id", updateAssociationByIdController);
associationRoutes.put("/:id", updateAssociationByIdController);
associationRoutes.delete("/:id", deleteAssociationPermanentlyController);

export default associationRoutes;
