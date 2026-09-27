import { Router } from "express";
import { joinWorkspaceController } from "./member.controller";

const memberRoutes = Router();

memberRoutes.post("/workspace/:inviteCode/join", joinWorkspaceController);

export default memberRoutes;
