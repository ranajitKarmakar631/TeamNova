export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params?: Record<string, any>) =>
    ["notifications", "list", params] as const,
  unreadCount: (workspaceId?: string) =>
    ["notifications", "unread-count", workspaceId || "all"] as const,
};

export const NOTIFICATION_QUERY_KEYS = notificationKeys;

