import { TaskPriorityEnumType, TaskStatusEnumType } from "@/constant";
import { PaginationType } from "@/features/project/types/project.types";

export type TaskAssigneeType = {
  _id: string;
  name: string;
  email?: string;
  profilePicture: string | null;
};

export type TaskType = {
  _id: string;
  title: string;
  description?: string;
  project?: {
    _id: string;
    emoji: string;
    name: string;
  };
  team?: {
    _id: string;
    name: string;
    slug?: string;
    description?: string | null;
  } | null;
  priority: TaskPriorityEnumType;
  status: TaskStatusEnumType;
  assignedTo: TaskAssigneeType[] | TaskAssigneeType | null;
  reportedTo?: TaskAssigneeType | null;
  createdBy?: string;
  dueDate: string;
  taskCode: string;
  commentCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTaskPayloadType = {
  workspaceId: string;
  projectId: string;
  data: {
    title: string;
    description: string;
    priority: TaskPriorityEnumType;
    status: TaskStatusEnumType;
    assignedTo: string | string[];
    reportedTo?: string | null;
    dueDate: string;
    teamId?: string | null;
  };
};

export type EditTaskPayloadType = {
  taskId: string;
  workspaceId: string;
  projectId: string;
  data: Partial<{
    title: string;
    description: string;
    priority: TaskPriorityEnumType;
    status: TaskStatusEnumType;
    assignedTo: string | string[];
    reportedTo?: string | null;
    dueDate: string;
    teamId: string | null;
  }>;
};

export type AllTaskPayloadType = {
  workspaceId: string;
  projectId?: string | null;
  teamId?: string | null;
  keyword?: string | null;
  priority?: TaskPriorityEnumType | null;
  status?: TaskStatusEnumType | null;
  assignedTo?: string | null;
  dueDate?: string | null;
  pageNumber?: number | null;
  pageSize?: number | null;
};

export type AllTaskResponseType = {
  message: string;
  tasks: TaskType[];
  pagination: PaginationType;
};

// ********** TASK COMMENT TYPES ****************
export type CommentAuthorType = {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string | null;
};

export type CommentAttachmentType = {
  name: string;
  url: string;
  size?: number;
  type?: string;
};

export type CommentReactionType = {
  emoji: string;
  users: Array<{
    _id: string;
    name: string;
    profilePicture?: string | null;
  }>;
};

export type CommentType = {
  _id: string;
  task: string;
  workspace: string;
  project: string;
  author: CommentAuthorType;
  content: any; // Lexical JSON AST object or string
  parentId: string | null;
  rootParentId: string | null;
  replyCount: number;
  mentions: CommentAuthorType[];
  attachments: CommentAttachmentType[];
  reactions: CommentReactionType[];
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCommentPayloadType = {
  workspaceId: string;
  taskId: string;
  content: any;
  parentId?: string | null;
  mentions?: string[];
  attachments?: CommentAttachmentType[];
};

export type UpdateCommentPayloadType = {
  workspaceId: string;
  commentId: string;
  content: any;
};

export type DeleteCommentPayloadType = {
  workspaceId: string;
  commentId: string;
};

export type ToggleCommentReactionPayloadType = {
  workspaceId: string;
  commentId: string;
  emoji: string;
};

export type GetCommentsPayloadType = {
  workspaceId: string;
  taskId: string;
  pageNumber?: number;
  pageSize?: number;
  cursor?: string;
  parentId?: string | null;
  sortOrder?: "asc" | "desc";
};

export type CommentsResponseType = {
  message: string;
  comments: CommentType[];
  pagination: PaginationType & {
    hasMore?: boolean;
    nextCursor?: string | null;
  };
};

export type CommentRepliesResponseType = {
  message: string;
  parentComment: CommentType;
  replies: CommentType[];
  pagination: PaginationType & {
    hasMore?: boolean;
  };
};

