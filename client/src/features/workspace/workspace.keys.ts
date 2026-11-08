export const workspaceKeys = {
  all: ["workspaces"] as const,
  userWorkspaces: ["userWorkspaces"] as const,
  detail: (workspaceId: string) => ["workspace", workspaceId] as const,
  analytics: (workspaceId: string) => ["workspace-analytics", workspaceId] as const,
  invitations: (workspaceId: string) => ["workspaceInvitations", workspaceId] as const,
  inviteDetails: (tokenOrCode: string) => ["inviteDetails", tokenOrCode] as const,
};

