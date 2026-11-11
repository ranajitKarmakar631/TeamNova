export const teamKeys = {
  all: ["teams"] as const,
  lists: () => [...teamKeys.all, "list"] as const,
  list: (
    workspaceId: string,
    keyword?: string | null,
    status?: string | null,
    projectId?: string | null,
    pageNumber?: number | null,
    pageSize?: number | null,
    onlyMyTeams?: boolean
  ) =>
    [
      "all-teams",
      workspaceId,
      keyword,
      status,
      projectId,
      pageNumber,
      pageSize,
      onlyMyTeams ? "my" : undefined,
    ].filter((v) => v !== undefined && v !== null),
  allTeamsInWorkspace: (workspaceId: string) => ["all-teams", workspaceId] as const,
  details: () => [...teamKeys.all, "detail"] as const,
  detail: (teamId: string) => ["team-detail", teamId] as const,
};

