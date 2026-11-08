import { Request, Response } from "express";
import { asyncHandler } from "../../common/middlewares/asyncHandler.middleware";
import {
  commentIdSchema,
  createCommentSchema,
  getCommentsQuerySchema,
  toggleReactionSchema,
  updateCommentSchema,
} from "./comment.validation";
import { taskIdSchema } from "../task/task.validation";
import { workspaceIdSchema } from "../workspace/workspace.validation";
import {
  createCommentService,
  deleteCommentService,
  getCommentRepliesService,
  getTaskCommentsService,
  toggleCommentReactionService,
  updateCommentService,
} from "./comment.service";
import { HTTPSTATUS } from "../../config/http.config";

export const createCommentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const workspaceId = workspaceIdSchema.parse(
      req.params.workspaceId || req.body.workspaceId || req.query.workspaceId
    );
    const taskId = taskIdSchema.parse(req.params.taskId || req.body.taskId);
    const body = createCommentSchema.parse(req.body);

    const { comment } = await createCommentService(
      workspaceId,
      taskId,
      userId,
      body
    );

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Comment created successfully",
      comment,
    });
  }
);

export const getTaskCommentsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const workspaceId = workspaceIdSchema.parse(
      req.params.workspaceId || req.query.workspaceId
    );
    const taskId = taskIdSchema.parse(req.params.taskId);
    const query = getCommentsQuerySchema.parse(req.query);

    const result = await getTaskCommentsService(
      workspaceId,
      taskId,
      userId,
      query
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Comments fetched successfully",
      ...result,
    });
  }
);

export const getCommentRepliesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const workspaceId = workspaceIdSchema.parse(
      req.params.workspaceId || req.query.workspaceId
    );
    const commentId = commentIdSchema.parse(req.params.commentId);
    const query = getCommentsQuerySchema.parse(req.query);

    const result = await getCommentRepliesService(
      workspaceId,
      commentId,
      userId,
      {
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      }
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Replies fetched successfully",
      ...result,
    });
  }
);

export const updateCommentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const workspaceId = workspaceIdSchema.parse(
      req.params.workspaceId || req.body.workspaceId || req.query.workspaceId
    );
    const commentId = commentIdSchema.parse(req.params.commentId);
    const body = updateCommentSchema.parse(req.body);

    const { comment } = await updateCommentService(
      workspaceId,
      commentId,
      userId,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Comment updated successfully",
      comment,
    });
  }
);

export const deleteCommentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const workspaceId = workspaceIdSchema.parse(
      req.params.workspaceId || req.query.workspaceId || req.body.workspaceId
    );
    const commentId = commentIdSchema.parse(req.params.commentId);

    const result = await deleteCommentService(workspaceId, commentId, userId);

    return res.status(HTTPSTATUS.OK).json(result);
  }
);

export const toggleReactionController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const workspaceId = workspaceIdSchema.parse(
      req.params.workspaceId || req.body.workspaceId || req.query.workspaceId
    );
    const commentId = commentIdSchema.parse(req.params.commentId);
    const body = toggleReactionSchema.parse(req.body);

    const { reactions } = await toggleCommentReactionService(
      workspaceId,
      commentId,
      userId,
      body.emoji
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Reaction updated successfully",
      reactions,
    });
  }
);

