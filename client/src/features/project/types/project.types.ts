import { AssociationRoleType } from "@/constant";
import { TeamType } from "@/features/team/types/team.types";

export type PaginationType = {
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  totalPages: number;
  skip: number;
  limit: number;
};

export type ProjectType = {
  _id: string;
  name: string;
  emoji: string;
  description: string;
  workspace: string;
  team?: TeamType | string | null;
  teams?: (TeamType | string)[];
  createdBy: {
    _id: string;
    name: string;
    profilePicture: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectPayloadType = {
  workspaceId: string;
  data: {
    emoji: string;
    name: string;
    description: string;
    teamId?: string;
    teamIds?: string[];
    newTeam?: {
      name: string;
      description?: string;
    };
  };
};

export type ProjectResponseType = {
  message: string;
  project: ProjectType;
};

export type EditProjectPayloadType = {
  workspaceId: string;
  projectId: string;
  data: {
    emoji?: string;
    name?: string;
    description?: string;
    teamId?: string;
    teamIds?: string[];
  };
};

export type AssignTeamsToProjectPayloadType = {
  workspaceId: string;
  projectId: string;
  teamIds: string[];
};

export type RemoveTeamFromProjectPayloadType = {
  workspaceId: string;
  projectId: string;
  teamId: string;
};

export type AllProjectPayloadType = {
  workspaceId: string;
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  skip?: boolean;
  onlyMyProjects?: boolean;
};

export type AllProjectResponseType = {
  message: string;
  projects: ProjectType[];
  pagination: PaginationType;
};

export type ProjectOverviewType = {
  project: ProjectType & {
    team?: {
      _id: string;
      name: string;
      slug?: string;
      description?: string;
      status?: string;
    } | null;
    teams?: Array<{
      _id: string;
      name: string;
      slug?: string;
      description?: string;
      status?: string;
    }>;
  };
  head: {
    memberId?: string;
    user: {
      _id: string;
      name: string;
      email?: string;
      profilePicture?: string;
    };
    workspaceRole?: string;
    role: string;
  };
  kpis: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    inReviewTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    totalMembers: number;
    totalTeams: number;
    progressPercentage: number;
  };
};

export type ProjectOverviewResponseType = {
  message: string;
} & ProjectOverviewType;

export type ProjectTeamMemberType = {
  memberId: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  workspaceRole?: string;
  teamRole: AssociationRoleType;
  projectRole?: AssociationRoleType | null;
  taskCount: number;
};

export type ProjectTeamItemType = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  status: string;
  head?: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  } | null;
  lead?: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  } | null;
  totalMembers: number;
  members: ProjectTeamMemberType[];
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionPercentage: number;
  workloadDistribution: number;
};

export type ProjectTeamsResponseType = {
  message: string;
  teams: ProjectTeamItemType[];
  totalCount?: number;
};

export type ProjectMemberItemType = {
  associationId: string;
  memberId: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  workspaceRole: string;
  projectRole: AssociationRoleType;
  teams: {
    _id: string;
    name: string;
    slug?: string;
    role?: string;
  }[];
  totalAssignedTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionPercentage: number;
  joinedAt: string;
};

export type ProjectMembersResponseType = {
  message: string;
  members: ProjectMemberItemType[];
  totalCount?: number;
  teams?: { id: string; name: string }[];
};

export type GetProjectMembersPayloadType = {
  workspaceId: string;
  projectId: string;
  search?: string;
  teamId?: string;
  role?: string;
  sortBy?: "tasks" | "completion" | "name";
};

export type GetProjectTeamsPayloadType = {
  workspaceId: string;
  projectId: string;
  search?: string;
  status?: string;
};

export type ProjectMemberTasksResponseType = {
  message: string;
  tasks: any[];
  kpis: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionPercentage: number;
  };
};

export type ProjectByIdPayloadType = {
  workspaceId: string;
  projectId: string;
};

