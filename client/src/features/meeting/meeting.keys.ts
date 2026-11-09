export const meetingKeys = {
  all: ["meetings"] as const,
  lists: () => [...meetingKeys.all, "list"] as const,
  list: (workspaceId: string, filters?: Record<string, any>) =>
    [...meetingKeys.lists(), workspaceId, filters] as const,
  stats: (workspaceId: string) => [...meetingKeys.all, "stats", workspaceId] as const,
  calendar: (workspaceId: string, start?: string, end?: string, filterType?: string) =>
    [...meetingKeys.all, "calendar", workspaceId, start, end, filterType] as const,
  details: () => [...meetingKeys.all, "detail"] as const,
  detail: (workspaceId: string, meetingId: string) =>
    [...meetingKeys.details(), workspaceId, meetingId] as const,
  activities: (workspaceId: string, meetingId: string) =>
    [...meetingKeys.all, "activities", workspaceId, meetingId] as const,
};

