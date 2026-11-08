import { Router } from "express";
import {
  createCommentController,
  deleteCommentController,
  getCommentRepliesController,
  getTaskCommentsController,
  toggleReactionController,
  updateCommentController,
} from "./comment.controller";

const commentRoutes = Router();

// 1. Task-scoped comments (Create & List)
commentRoutes.post(
  "/workspaces/:workspaceId/tasks/:taskId",
  createCommentController
);
commentRoutes.post(
  "/workspace/:workspaceId/task/:taskId",
  createCommentController
);
commentRoutes.post("/tasks/:taskId", createCommentController);
commentRoutes.post("/task/:taskId", createCommentController);

commentRoutes.get(
  "/workspaces/:workspaceId/tasks/:taskId",
  getTaskCommentsController
);
commentRoutes.get(
  "/workspace/:workspaceId/task/:taskId",
  getTaskCommentsController
);
commentRoutes.get("/tasks/:taskId", getTaskCommentsController);
commentRoutes.get("/task/:taskId", getTaskCommentsController);

// 2. Thread replies
commentRoutes.get(
  "/workspaces/:workspaceId/comments/:commentId/replies",
  getCommentRepliesController
);
commentRoutes.get(
  "/workspace/:workspaceId/comment/:commentId/replies",
  getCommentRepliesController
);
commentRoutes.get("/:commentId/replies", getCommentRepliesController);

// 3. Comment modifications (Edit & Delete)
commentRoutes.patch(
  "/workspaces/:workspaceId/comments/:commentId",
  updateCommentController
);
commentRoutes.patch(
  "/workspace/:workspaceId/comment/:commentId",
  updateCommentController
);
commentRoutes.put(
  "/workspaces/:workspaceId/comments/:commentId",
  updateCommentController
);
commentRoutes.put(
  "/workspace/:workspaceId/comment/:commentId",
  updateCommentController
);
commentRoutes.patch("/:commentId", updateCommentController);
commentRoutes.put("/:commentId", updateCommentController);

commentRoutes.delete(
  "/workspaces/:workspaceId/comments/:commentId",
  deleteCommentController
);
commentRoutes.delete(
  "/workspace/:workspaceId/comment/:commentId",
  deleteCommentController
);
commentRoutes.delete("/:commentId", deleteCommentController);

// 4. Reactions
commentRoutes.post(
  "/workspaces/:workspaceId/comments/:commentId/reactions",
  toggleReactionController
);
commentRoutes.post(
  "/workspace/:workspaceId/comment/:commentId/reactions",
  toggleReactionController
);
commentRoutes.post(
  "/workspaces/:workspaceId/comments/:commentId/reaction",
  toggleReactionController
);
commentRoutes.post(
  "/workspace/:workspaceId/comment/:commentId/react",
  toggleReactionController
);
commentRoutes.post(
  "/workspaces/:workspaceId/comments/:commentId/react",
  toggleReactionController
);
commentRoutes.post("/:commentId/reactions", toggleReactionController);
commentRoutes.post("/:commentId/reaction", toggleReactionController);
commentRoutes.post("/:commentId/react", toggleReactionController);

export default commentRoutes;

