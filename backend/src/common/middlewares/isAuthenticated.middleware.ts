import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { UnauthorizedException } from "../utils/appError";
import { verifyAccessToken } from "../utils/jwt";
import UserModel from "../../modules/user/user.model";
import { asyncHandler } from "./asyncHandler.middleware";
import { redis, getJsonCache, setJsonCache } from "../../redis/redis.service";
import { REDIS_KEYS, REDIS_TTL } from "../../redis/redis.keys";

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

    // Check if token was revoked via logout
    try {
      const isBlacklisted = await redis.get(REDIS_KEYS.TOKEN_BLACKLIST(token));
      if (isBlacklisted) {
        throw new UnauthorizedException("Session revoked. Please log in again.");
      }
    } catch {
      // Gracefully continue if Redis check encounters an issue
    }

    const decoded = verifyAccessToken(token);

    // Attempt to load cached session from Redis
    const sessionKey = REDIS_KEYS.USER_SESSION(decoded.userId);
    let user: any = await getJsonCache<any>(sessionKey);

    if (user) {
      user._id = new mongoose.Types.ObjectId(user._id);
      if (user.currentWorkspace) {
        user.currentWorkspace = new mongoose.Types.ObjectId(user.currentWorkspace);
      }
    } else {
      const dbUser = await UserModel.findById(decoded.userId).lean();
      if (!dbUser) {
        throw new UnauthorizedException("User not found or session invalid.");
      }

      user = dbUser;
      await setJsonCache(sessionKey, dbUser, REDIS_TTL.SESSION);
    }

    if (!user.isActive) {
      throw new UnauthorizedException("User account is deactivated or suspended.");
    }

    req.user = user as Express.User;
    next();
  }
);

export default isAuthenticated;
