import { Router } from "express";
import {
  createTaskController,
  deleteTaskController,
  getAllTasksController,
  getTaskByIdController,
  updateTaskController,
} from "./task.controller";

const taskRoutes = Router();

// Tasks in workspace
taskRoutes.get("/workspaces/:workspaceId", getAllTasksController);
taskRoutes.get("/workspace/:workspaceId/all", getAllTasksController);

// Task creation in project & workspace
taskRoutes.post(
  "/projects/:projectId/workspaces/:workspaceId",
  createTaskController
);
taskRoutes.post(
  "/project/:projectId/workspace/:workspaceId/create",
  createTaskController
);

// Single task item operations
taskRoutes.get(
  "/:taskId/projects/:projectId/workspaces/:workspaceId",
  getTaskByIdController
);
taskRoutes.get(
  "/:taskId/project/:projectId/workspace/:workspaceId",
  getTaskByIdController
);

taskRoutes.patch(
  "/:taskId/projects/:projectId/workspaces/:workspaceId",
  updateTaskController
);
taskRoutes.put(
  "/:taskId/projects/:projectId/workspaces/:workspaceId",
  updateTaskController
);
taskRoutes.put(
  "/:taskId/project/:projectId/workspace/:workspaceId/update",
  updateTaskController
);
taskRoutes.put(
  "/:taskId/project/:projectId/workspace/:workspaceId/update/",
  updateTaskController
);
taskRoutes.patch(
  "/:taskId/project/:projectId/workspace/:workspaceId/update",
  updateTaskController
);

taskRoutes.delete(
  "/:taskId/workspaces/:workspaceId",
  deleteTaskController
);
taskRoutes.delete(
  "/:taskId/workspace/:workspaceId/delete",
  deleteTaskController
);

export default taskRoutes;
