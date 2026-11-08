import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../utils/appError";
import { verifyAccessToken } from "../utils/jwt";
import UserModel from "../../modules/user/user.model";
import { asyncHandler } from "./asyncHandler.middleware";

const isAuthenticated = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      throw new UnauthorizedException("Unauthorized. Please log in.");
    }

    const decoded = verifyAccessToken(token);

    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new UnauthorizedException("User not found or session invalid.");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("User account is deactivated or suspended.");
    }

    req.user = user;
    next();
  }
);

export default isAuthenticated;
