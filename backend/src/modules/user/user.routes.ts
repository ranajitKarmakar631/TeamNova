import { Router } from "express";
import { getCurrentUserController } from "./user.controller";

const userRoutes = Router();

userRoutes.get("/current", getCurrentUserController);

export default userRoutes;
