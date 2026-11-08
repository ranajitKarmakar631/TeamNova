
import "dotenv/config";
import { createServer } from "http";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import { errorHandler } from "./common/middlewares/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./common/middlewares/asyncHandler.middleware";
import isAuthenticated from "./common/middlewares/isAuthenticated.middleware";

import { authRoutes } from "./modules/auth";
import { userRoutes } from "./modules/user";
import { workspaceRoutes } from "./modules/workspace";
import { memberRoutes } from "./modules/member";
import { projectRoutes } from "./modules/project";
import { taskRoutes } from "./modules/task";
import { commentRoutes } from "./modules/comment";
import { inviteRoutes } from "./modules/invite";
import { associationRoutes } from "./modules/association";
import teamRoute from "./modules/teams/teams.router";
import {
  notificationRoutes,
  initNotificationWorker,
  closeNotificationWorker,
  closeNotificationQueue,
} from "./modules/notification";

import { sendEmail } from "./config/sendMail";
import { redis } from "./redis/redis.service";
import { initSocket } from "./modules/chats/socket/socket.instance";

const app = express();
const server = createServer(app);

const BASE_PATH = config.BASE_PATH;

// --------------------------------------------------
// Express middleware
// --------------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  }),
);

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get(
  "/",
  asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      return res.status(HTTPSTATUS.OK).json({
        message: "Server is healthy and running",
      });
    },
  ),
);

// --------------------------------------------------
// API routes
// --------------------------------------------------

app.use(`${BASE_PATH}/auth`, authRoutes);

// Primary plural mounts
app.use(`${BASE_PATH}/users`, isAuthenticated, userRoutes);
app.use(`${BASE_PATH}/workspaces`, isAuthenticated, workspaceRoutes);
app.use(`${BASE_PATH}/members`, isAuthenticated, memberRoutes);
app.use(`${BASE_PATH}/projects`, isAuthenticated, projectRoutes);
app.use(`${BASE_PATH}/tasks`, isAuthenticated, taskRoutes);
app.use(`${BASE_PATH}/comments`, isAuthenticated, commentRoutes);
app.use(`${BASE_PATH}/invites`, inviteRoutes);
app.use(`${BASE_PATH}/associations`, isAuthenticated, associationRoutes);
app.use(`${BASE_PATH}/teams`, isAuthenticated, teamRoute);
app.use(`${BASE_PATH}/notifications`, isAuthenticated, notificationRoutes);

// Backward-compatible singular mounts
app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);
app.use(`${BASE_PATH}/workspace`, isAuthenticated, workspaceRoutes);
app.use(`${BASE_PATH}/member`, isAuthenticated, memberRoutes);
app.use(`${BASE_PATH}/project`, isAuthenticated, projectRoutes);
app.use(`${BASE_PATH}/task`, isAuthenticated, taskRoutes);
app.use(`${BASE_PATH}/comment`, isAuthenticated, commentRoutes);
app.use(`${BASE_PATH}/invite`, inviteRoutes);
app.use(`${BASE_PATH}/association`, isAuthenticated, associationRoutes);
app.use(`${BASE_PATH}/team`, isAuthenticated, teamRoute);
app.use(`${BASE_PATH}/notification`, isAuthenticated, notificationRoutes);

// --------------------------------------------------
// Global error handler
// --------------------------------------------------

app.use(errorHandler);

// --------------------------------------------------
// Start application
// --------------------------------------------------

const startServer = async (): Promise<void> => {
  try {
    // 1. Connect MongoDB
    await connectDatabase();
    console.log("MongoDB connected successfully");

    // 2. Verify Redis connection
    const redisStatus = await redis.ping();

    if (redisStatus !== "PONG") {
      throw new Error("Redis health check failed");
    }

    console.log("Redis connected successfully");

    // 3. Initialize Socket.IO
    initSocket(server);

    // 4. Initialize Notification Queue Worker
    initNotificationWorker();

    // 5. Start HTTP and Socket.IO on the same port
    server.listen(config.PORT, () => {
      console.log(
        `Server listening on port ${config.PORT} in ${config.NODE_ENV}`,
      );

    });
  } catch (error) {
    console.error("Server startup failed:", error);

    await closeNotificationWorker().catch(() => undefined);
    await closeNotificationQueue().catch(() => undefined);
    await redis.quit().catch(() => undefined);

    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  try {
    await closeNotificationWorker();
    await closeNotificationQueue();
    await redis.quit().catch(() => undefined);
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));

void startServer();
