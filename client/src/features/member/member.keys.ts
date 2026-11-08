export const memberKeys = {
  all: ["members"] as const,
  workspaceMembers: (workspaceId: string) => ["members", workspaceId] as const,
};

