export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (workspaceId: string, pageNumber?: number, pageSize?: number, keyword?: string) =>
    ["allprojects", workspaceId, pageNumber, pageSize, keyword].filter(
      (v) => v !== undefined
    ),
  allProjectsInWorkspace: (workspaceId: string) => ["allprojects", workspaceId] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (projectId: string) => ["singleProject", projectId] as const,
  analytics: (projectId: string) => ["project-analytics", projectId] as const,
  overview: (projectId: string) => ["project-overview", projectId] as const,
  teams: (projectId: string, workspaceId?: string, search?: string, status?: string) =>
    ["project-teams", projectId, workspaceId, search, status].filter(
      (v) => v !== undefined
    ),
  members: (projectId: string, workspaceId?: string, search?: string, teamId?: string, role?: string, sortBy?: string) =>
    ["project-members", projectId, workspaceId, search, teamId, role, sortBy].filter(
      (v) => v !== undefined
    ),
  memberTasks: (projectId: string, userId: string) =>
    ["project-member-tasks", projectId, userId] as const,
  byTeam: (workspaceId: string, teamId: string) =>
    ["projects-by-team", workspaceId, teamId] as const,
};

