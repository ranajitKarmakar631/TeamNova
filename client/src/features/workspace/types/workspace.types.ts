import { PermissionType } from "@/constant";

export type WorkspaceType = {
  _id: string;
  name: string;
  description?: string;
  owner: string;
  inviteCode: string;
};

export type CreateWorkspaceType = {
  name: string;
  description: string;
};

export type EditWorkspaceType = {
  workspaceId: string;
  data: {
    name: string;
    description: string;
  };
};

export type CreateWorkspaceResponseType = {
  message: string;
  workspace: WorkspaceType;
};

export type AllWorkspaceResponseType = {
  message: string;
  workspaces: WorkspaceType[];
};

export type WorkspaceWithMembersType = WorkspaceType & {
  members: {
    _id: string;
    userId: string;
    workspaceId: string;
    role: {
      _id: string;
      name: string;
      permissions: PermissionType[];
    };
    joinedAt: string;
    createdAt: string;
  }[];
};

export type WorkspaceByIdResponseType = {
  message: string;
  workspace: WorkspaceWithMembersType;
};

export type AnalyticsResponseType = {
  message: string;
  analytics: {
    totalTasks: number;
    overdueTasks: number;
    completedTasks: number;
  };
};

export type DeleteWorkspaceResponseType = {
  message: string;
  currentWorkspace: string;
};

// Workspace Invites
export type CreateLinkInvitePayloadType = {
  workspaceId: string;
  role?: string;
  maxUses?: number | null;
  expiresInDays?: number;
};

export type CreateEmailInvitePayloadType = {
  workspaceId: string;
  email: string;
  role?: string;
  expiresInDays?: number;
};

export type CreateInviteResponseType = {
  message: string;
  invitation: any;
  token: string;
  inviteUrl: string;
};

export type RevokeInvitationPayloadType = {
  workspaceId: string;
  invitationId: string;
};

export type AcceptInviteResponseType = {
  message: string;
  workspaceId: string;
  role: string;
};

export type JoinWorkspaceResponseType = {
  message: string;
  workspaceId: string;
};

