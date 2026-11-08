export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (
    workspaceId: string,
    projectId?: string | null,
    teamId?: string | null,
    keyword?: string | null,
    priority?: string | null,
    status?: string | null,
    assignedTo?: string | null,
    dueDate?: string | null,
    pageNumber?: number | null,
    pageSize?: number | null
  ) =>
    [
      "all-tasks",
      workspaceId,
      projectId,
      teamId,
      keyword,
      priority,
      status,
      assignedTo,
      dueDate,
      pageNumber,
      pageSize,
    ].filter((v) => v !== undefined && v !== null),
  allTasksInWorkspace: (workspaceId?: string) =>
    workspaceId ? (["all-tasks", workspaceId] as const) : (["all-tasks"] as const),
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (taskId: string) => ["task", taskId] as const,
  comments: (
    workspaceId: string,
    taskId: string,
    pageNumber?: number,
    pageSize?: number,
    parentId?: string | null,
    sortOrder?: string
  ) =>
    [
      "task-comments",
      workspaceId,
      taskId,
      pageNumber,
      pageSize,
      parentId,
      sortOrder,
    ].filter((v) => v !== undefined),
  allComments: ["task-comments"] as const,
  replies: (
    workspaceId: string,
    commentId: string,
    pageNumber?: number,
    pageSize?: number
  ) =>
    ["comment-replies", workspaceId, commentId, pageNumber, pageSize].filter(
      (v) => v !== undefined
    ),
  allReplies: ["comment-replies"] as const,
};

