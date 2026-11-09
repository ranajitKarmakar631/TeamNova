export const REDIS_KEYS = {
  // --- Auth & User Sessions ---
  USER_SESSION: (userId: string) => `user:session:${userId}`,
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  TOKEN_BLACKLIST: (token: string) => `auth:blacklist:${token}`,

  // --- Workspace & RBAC ---
  WORKSPACE_EXISTS: (workspaceId: string) => `workspace:${workspaceId}:exists`,
  WORKSPACE_MEMBER_ROLE: (workspaceId: string, userId: string) =>
    `workspace:${workspaceId}:member:${userId}:role`,
  WORKSPACE_MEMBERS: (workspaceId: string) => `workspace:${workspaceId}:members`,
  WORKSPACE_ANALYTICS: (workspaceId: string) => `workspace:${workspaceId}:analytics`,

  // --- Projects & Tasks ---
  PROJECT_DETAILS: (projectId: string) => `project:${projectId}:details`,
  PROJECT_OVERVIEW: (projectId: string) => `project:${projectId}:overview`,
  PROJECT_ANALYTICS: (projectId: string) => `project:${projectId}:analytics`,
  TASK_DETAILS: (taskId: string) => `task:${taskId}:details`,

  // --- Notifications ---
  NOTIFICATION_UNREAD_COUNT: (userId: string, workspaceId?: string) =>
    workspaceId
      ? `user:${userId}:notifications:unread:${workspaceId}`
      : `user:${userId}:notifications:unread:all`,

  // --- Invites ---
  INVITE_DETAILS: (tokenHash: string) => `invite:details:${tokenHash}`,

  // --- Sockets & Real-time (Existing) ---
  ONLINE_USERS: "online:users",
  USER_SOCKETS: (userId: string) => `user:${userId}:sockets`,
} as const;

export const REDIS_TTL = {
  NEGATIVE: 60,         // 1 minute (for negative cache / not found items)
  SHORT: 60,            // 1 minute
  ANALYTICS: 120,       // 2 minutes (workspace & project analytics)
  SESSION: 900,         // 15 minutes (matches JWT access token lifetime)
  ROLE: 900,            // 15 minutes (workspace membership & roles)
  MEMBERS: 900,         // 15 minutes (workspace members list)
  PROFILE: 900,         // 15 minutes
  LONG: 3600,           // 1 hour (workspace existence)
  DAY: 86400,           // 24 hours
} as const;
