import mongoose from "mongoose";
import CommentModel, { CommentDocument } from "./comment.model";
import TaskModel from "../task/task.model";
import UserModel from "../user/user.model";
import { getMemberRoleInWorkspace } from "../member/member.service";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../../common/utils/appError";
import { WorkspaceRoles } from "../../common/enums/association.enum";
import {
  notificationService,
  NotificationTypeEnum,
} from "../notification";

export interface CreateCommentInput {
  content: any;
  parentId?: string | null;
  mentions?: string[];
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
    type?: string;
  }>;
}

export interface GetCommentsQueryInput {
  pageNumber?: number;
  pageSize?: number;
  cursor?: string;
  sortOrder?: "asc" | "desc";
  parentId?: string | null;
}

// Helper to extract readable plain text from string or Lexical JSON AST
export const extractPlainTextFromContent = (content: any): string => {
  if (!content) return "";
  if (typeof content === "string") return content;

  const textPieces: string[] = [];
  const traverse = (node: any) => {
    if (!node) return;
    if (node.text && typeof node.text === "string") {
      textPieces.push(node.text);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
  };

  traverse(content.root || content);
  return textPieces.join(" ").trim();
};

// Helper to extract mentioned user IDs from Lexical JSON AST
export const extractMentionsFromLexicalContent = (content: any): string[] => {
  if (!content || typeof content !== "object") return [];
  const mentionIds: string[] = [];

  const traverse = (node: any) => {
    if (!node) return;
    if (node.type === "mention" && node.mentionId) {
      mentionIds.push(String(node.mentionId));
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
  };

  traverse(content.root || content);
  return Array.from(new Set(mentionIds));
};

export const createCommentService = async (
  workspaceId: string,
  taskId: string,
  userId: string,
  data: CreateCommentInput
) => {
  // 1. Verify workspace membership
  await getMemberRoleInWorkspace(userId, workspaceId);

  // 2. Verify task belongs to this workspace
  const task = await TaskModel.findOne({
    _id: taskId,
    workspace: workspaceId,
  });

  if (!task) {
    throw new NotFoundException("Task not found or does not belong to this workspace");
  }

  // 3. Handle threading & parent reference
  let rootParentId: mongoose.Types.ObjectId | null = null;
  let parentComment: CommentDocument | null = null;

  if (data.parentId) {
    parentComment = await CommentModel.findOne({
      _id: data.parentId,
      task: taskId,
      workspace: workspaceId,
    });

    if (!parentComment) {
      throw new NotFoundException("Parent comment not found in this task");
    }

    // Single-tier or multi-tier root identification
    const parentIdObj = parentComment._id as mongoose.Types.ObjectId;
    rootParentId = parentComment.rootParentId || parentIdObj;

    // Atomically increment reply counter on parent comment
    await CommentModel.findByIdAndUpdate(parentIdObj, {
      $inc: { replyCount: 1 },
    });

    if (
      parentComment.rootParentId &&
      parentComment.rootParentId.toString() !== parentIdObj.toString()
    ) {
      await CommentModel.findByIdAndUpdate(parentComment.rootParentId, {
        $inc: { replyCount: 1 },
      });
    }
  }

  // 4. Validate and format mentions (from explicit array + Lexical JSON AST)
  const allMentionIdStrings = new Set<string>([
    ...(Array.isArray(data.mentions) ? data.mentions : []),
    ...extractMentionsFromLexicalContent(data.content),
  ]);

  const validMentionIds: mongoose.Types.ObjectId[] = [];
  for (const mentionId of allMentionIdStrings) {
    if (mongoose.isValidObjectId(mentionId)) {
      validMentionIds.push(new mongoose.Types.ObjectId(mentionId));
    }
  }

  // 5. Create comment
  const comment = await CommentModel.create({
    task: taskId,
    workspace: workspaceId,
    project: task.project,
    author: userId,
    content: data.content,
    parentId: data.parentId ? new mongoose.Types.ObjectId(data.parentId) : null,
    rootParentId,
    mentions: validMentionIds,
    attachments: data.attachments || [],
  });

  // 6. Atomically increment task commentCount for O(1) reads
  await TaskModel.findByIdAndUpdate(taskId, {
    $inc: { commentCount: 1 },
  });

  // 7. Populate author and mentions for immediate frontend display
  await comment.populate("author", "_id name profilePicture email");
  await comment.populate("mentions", "_id name profilePicture email");

  // 8. Asynchronous notification dispatch (fail-safe)
  try {
    const author = await UserModel.findById(userId).select("name");
    const authorName = author?.name || "A team member";
    const taskIdStr = String(task._id);
    const commentIdStr = String(comment._id);

    // A) Notify mentioned users
    for (const mentionId of validMentionIds) {
      if (mentionId.toString() !== userId.toString()) {
        await notificationService.queueNotification({
          recipient: mentionId.toString(),
          sender: userId,
          workspaceId,
          type: NotificationTypeEnum.GENERAL,
          title: `Mentioned by ${authorName}`,
          message: `${authorName} mentioned you in a comment on "${task.title}"`,
          data: {
            taskId: taskIdStr,
            commentId: commentIdStr,
          },
        });
      }
    }

    // B) Notify parent author if this is a reply
    if (
      parentComment &&
      parentComment.author.toString() !== userId.toString() &&
      !validMentionIds.some((m) => m.toString() === parentComment!.author.toString())
    ) {
      await notificationService.queueNotification({
        recipient: parentComment.author.toString(),
        sender: userId,
        workspaceId,
        type: NotificationTypeEnum.GENERAL,
        title: `Reply from ${authorName}`,
        message: `${authorName} replied to your comment on "${task.title}"`,
        data: {
          taskId: taskIdStr,
          commentId: commentIdStr,
        },
      });
    }

    // C) If top-level comment, notify task assignees & creator
    if (!data.parentId) {
      const recipientIds = new Set<string>();

      if (task.createdBy && task.createdBy.toString() !== userId.toString()) {
        recipientIds.add(task.createdBy.toString());
      }

      if (Array.isArray(task.assignedTo)) {
        for (const assignee of task.assignedTo) {
          const idStr = assignee.toString();
          if (idStr !== userId.toString()) {
            recipientIds.add(idStr);
          }
        }
      }

      for (const mentionId of validMentionIds) {
        recipientIds.delete(mentionId.toString());
      }

      const plainSnippet = extractPlainTextFromContent(data.content);
      const displaySnippet = plainSnippet.slice(0, 100);

      for (const recipientId of recipientIds) {
        await notificationService.queueNotification({
          recipient: recipientId,
          sender: userId,
          workspaceId,
          type: NotificationTypeEnum.GENERAL,
          title: `New comment on "${task.title}"`,
          message: `${authorName} commented: "${displaySnippet}${
            plainSnippet.length > 100 ? "..." : ""
          }"`,
          data: {
            taskId: taskIdStr,
            commentId: commentIdStr,
          },
        });
      }
    }
  } catch (error) {
    // Non-blocking log
    console.error("Failed to queue comment notifications:", error);
  }

  return { comment };
};

export const getTaskCommentsService = async (
  workspaceId: string,
  taskId: string,
  userId: string,
  query: GetCommentsQueryInput
) => {
  // 1. Verify workspace access
  await getMemberRoleInWorkspace(userId, workspaceId);

  const pageSize = Math.min(query.pageSize || 20, 100);
  const pageNumber = query.pageNumber || 1;
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const filter: Record<string, any> = {
    task: taskId,
    workspace: workspaceId,
  };

  // If parentId is not specified, default to top-level comments (parentId: null)
  if (query.parentId === undefined) {
    filter.parentId = null;
  } else if (query.parentId !== "all") {
    filter.parentId = query.parentId === "null" || !query.parentId ? null : query.parentId;
  }

  // Cursor pagination support
  if (query.cursor) {
    const cursorComment = await CommentModel.findById(query.cursor).select("createdAt");
    if (cursorComment) {
      filter.createdAt = sortOrder === 1
        ? { $gt: cursorComment.createdAt }
        : { $lt: cursorComment.createdAt };
    }
  }

  const skip = query.cursor ? 0 : (pageNumber - 1) * pageSize;

  const [comments, totalCount] = await Promise.all([
    CommentModel.find(filter)
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(pageSize)
      .populate("author", "_id name profilePicture email")
      .populate("mentions", "_id name profilePicture email")
      .populate("reactions.users", "_id name profilePicture")
      .lean(),
    CommentModel.countDocuments(filter),
  ]);

  // Sanitize soft-deleted comments
  const sanitizedComments = comments.map((c) => {
    if (c.isDeleted) {
      return {
        ...c,
        content: "This comment has been deleted.",
        attachments: [],
      };
    }
    return c;
  });

  const totalPages = Math.ceil(totalCount / pageSize);
  const nextCursor =
    comments.length === pageSize ? comments[comments.length - 1]._id.toString() : null;

  return {
    comments: sanitizedComments,
    pagination: {
      totalCount,
      totalPages,
      pageNumber,
      pageSize,
      hasMore: comments.length === pageSize,
      nextCursor,
    },
  };
};

export const getCommentRepliesService = async (
  workspaceId: string,
  commentId: string,
  userId: string,
  query: { pageNumber?: number; pageSize?: number }
) => {
  // 1. Verify workspace access
  await getMemberRoleInWorkspace(userId, workspaceId);

  const parentComment = await CommentModel.findOne({
    _id: commentId,
    workspace: workspaceId,
  })
    .populate("author", "_id name profilePicture email")
    .populate("reactions.users", "_id name profilePicture");

  if (!parentComment) {
    throw new NotFoundException("Comment not found");
  }

  const pageSize = Math.min(query.pageSize || 20, 100);
  const pageNumber = query.pageNumber || 1;
  const skip = (pageNumber - 1) * pageSize;

  const filter = {
    workspace: workspaceId,
    $or: [{ parentId: commentId }, { rootParentId: commentId }],
  };

  const [replies, totalCount] = await Promise.all([
    CommentModel.find(filter)
      .sort({ createdAt: 1 }) // Chronological order for replies
      .skip(skip)
      .limit(pageSize)
      .populate("author", "_id name profilePicture email")
      .populate("mentions", "_id name profilePicture email")
      .populate("reactions.users", "_id name profilePicture")
      .lean(),
    CommentModel.countDocuments(filter),
  ]);

  const sanitizedReplies = replies.map((r) => {
    if (r.isDeleted) {
      return {
        ...r,
        content: "This comment has been deleted.",
        attachments: [],
      };
    }
    return r;
  });

  return {
    parentComment,
    replies: sanitizedReplies,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      pageNumber,
      pageSize,
      hasMore: replies.length === pageSize,
    },
  };
};

export const updateCommentService = async (
  workspaceId: string,
  commentId: string,
  userId: string,
  data: { content: any }
) => {
  await getMemberRoleInWorkspace(userId, workspaceId);

  const comment = await CommentModel.findOne({
    _id: commentId,
    workspace: workspaceId,
  });

  if (!comment) {
    throw new NotFoundException("Comment not found");
  }

  if (comment.isDeleted) {
    throw new BadRequestException("Cannot edit a deleted comment");
  }

  if (comment.author.toString() !== userId.toString()) {
    throw new UnauthorizedException("You can only edit your own comments");
  }

  comment.content = data.content;
  comment.isEdited = true;
  comment.editedAt = new Date();
  await comment.save();

  await comment.populate("author", "_id name profilePicture email");
  await comment.populate("mentions", "_id name profilePicture email");
  await comment.populate("reactions.users", "_id name profilePicture");

  return { comment };
};

export const deleteCommentService = async (
  workspaceId: string,
  commentId: string,
  userId: string
) => {
  const { role } = await getMemberRoleInWorkspace(userId, workspaceId);

  const comment = await CommentModel.findOne({
    _id: commentId,
    workspace: workspaceId,
  });

  if (!comment) {
    throw new NotFoundException("Comment not found");
  }

  const isAuthor = comment.author.toString() === userId.toString();
  const isPrivileged = [
    WorkspaceRoles.OWNER,
    WorkspaceRoles.ADMIN,
    WorkspaceRoles.MANAGER,
  ].includes(role as any);

  if (!isAuthor && !isPrivileged) {
    throw new UnauthorizedException("You are not authorized to delete this comment");
  }

  // Check if comment has replies
  const hasReplies =
    comment.replyCount > 0 || (await CommentModel.exists({ parentId: comment._id }));

  if (hasReplies) {
    // Soft delete to maintain discussion tree integrity
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.content = "This comment has been deleted.";
    comment.attachments = [];
    await comment.save();
  } else {
    // Hard delete leaf comment
    await CommentModel.findByIdAndDelete(comment._id);

    // Atomically decrement task commentCount
    await TaskModel.findByIdAndUpdate(comment.task, {
      $inc: { commentCount: -1 },
    });

    // If it was a reply, decrement parent replyCount
    if (comment.parentId) {
      await CommentModel.findByIdAndUpdate(comment.parentId, {
        $inc: { replyCount: -1 },
      });
    }

    if (
      comment.rootParentId &&
      comment.rootParentId.toString() !== comment.parentId?.toString()
    ) {
      await CommentModel.findByIdAndUpdate(comment.rootParentId, {
        $inc: { replyCount: -1 },
      });
    }
  }

  return { message: "Comment deleted successfully" };
};

export const toggleCommentReactionService = async (
  workspaceId: string,
  commentId: string,
  userId: string,
  emoji: string
) => {
  await getMemberRoleInWorkspace(userId, workspaceId);

  const comment = await CommentModel.findOne({
    _id: commentId,
    workspace: workspaceId,
  });

  if (!comment) {
    throw new NotFoundException("Comment not found");
  }

  if (comment.isDeleted) {
    throw new BadRequestException("Cannot react to a deleted comment");
  }

  const userObjId = new mongoose.Types.ObjectId(userId);
  const reactionIndex = comment.reactions.findIndex((r) => r.emoji === emoji);

  if (reactionIndex > -1) {
    const existingReaction = comment.reactions[reactionIndex];
    const userIndex = existingReaction.users.findIndex(
      (u) => u.toString() === userId.toString()
    );

    if (userIndex > -1) {
      // User already reacted -> remove user
      existingReaction.users.splice(userIndex, 1);
      if (existingReaction.users.length === 0) {
        comment.reactions.splice(reactionIndex, 1);
      }
    } else {
      // User hasn't reacted with this emoji yet -> add user
      existingReaction.users.push(userObjId);
    }
  } else {
    // Add new emoji entry
    comment.reactions.push({
      emoji,
      users: [userObjId],
    });
  }

  await comment.save();
  await comment.populate("reactions.users", "_id name profilePicture");

  return { reactions: comment.reactions };
};
