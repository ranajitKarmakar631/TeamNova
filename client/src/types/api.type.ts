import {
  AssociationRoles,
  AssociationRoleType,
  PermissionType,
  TaskPriorityEnumType,
  TaskStatusEnumType,
  TeamStatusEnumType,
} from "@/constant";

export { AssociationRoles, type AssociationRoleType };

export type loginType = { email: string; password: string };
export type LoginResponseType = {
  message: string;
  user: {
    _id: string;
    currentWorkspace: string;
  };
  accessToken?: string;
  refreshToken?: string;
};

export type registerType = {
  name: string;
  email: string;
  password: string;
};

// USER TYPE
export type UserType = {
  _id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  isActive: true;
  lastLogin: null;
  createdAt: Date;
  updatedAt: Date;
  currentWorkspace: {
    _id: string;
    name: string;
    owner: string;
    inviteCode: string;
  };
};

export type CurrentUserResponseType = {
  message: string;
  user: UserType;
};

//******** */ WORLSPACE TYPES ****************
// ******************************************
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

export type ChangeWorkspaceMemberRoleType = {
  workspaceId: string;
  data: {
    roleId: string;
    memberId: string;
  };
};

export type AllMembersInWorkspaceResponseType = {
  message: string;
  members: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      profilePicture: string | null;
    };
    workspaceId: string;
    role: {
      _id: string;
      name: string;
    };
    joinedAt: string;
    createdAt: string;
  }[];
  roles: RoleType[];
};

export type AnalyticsResponseType = {
  message: string;
  analytics: {
    totalTasks: number;
    overdueTasks: number;
    completedTasks: number;
  };
};

export type PaginationType = {
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  totalPages: number;
  skip: number;
  limit: number;
};

export type RoleType = {
  _id: string;
  name: string;
};
// *********** MEMBER ****************

//******** */ PROJECT TYPES ****************
//****************************************** */
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

//ALL PROJECTS IN WORKSPACE TYPE
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

// PROJECT ENHANCEMENT TYPES
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
  tasks: TaskType[];
  kpis: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionPercentage: number;
  };
};

// SINGLE PROJECT IN WORKSPACE TYPE
export type ProjectByIdPayloadType = {
  workspaceId: string;
  projectId: string;
};

//********** */ TASK TYPES ************************
//************************************************* */

export type CreateTaskPayloadType = {
  workspaceId: string;
  projectId: string;
  data: {
    title: string;
    description: string;
    priority: TaskPriorityEnumType;
    status: TaskStatusEnumType;
    assignedTo: string | string[];
    reportedTo?: string | null;
    dueDate: string;
    teamId?: string | null;
  };
};


//added new for edtiting of task
export type EditTaskPayloadType = {
  taskId: string;
  workspaceId: string;
  projectId: string;
  data: Partial<{
    title: string;
    description: string;
    priority: TaskPriorityEnumType;
    status: TaskStatusEnumType;
    assignedTo: string | string[];
    reportedTo?: string | null;
    dueDate: string;
    teamId: string | null;
  }>;
};

export type TaskAssigneeType = {
  _id: string;
  name: string;
  email?: string;
  profilePicture: string | null;
};

export type TaskType = {
  _id: string;
  title: string;
  description?: string;
  project?: {
    _id: string;
    emoji: string;
    name: string;
  };
  team?: {
    _id: string;
    name: string;
    slug?: string;
    description?: string | null;
  } | null;
  priority: TaskPriorityEnumType;
  status: TaskStatusEnumType;
  assignedTo: TaskAssigneeType[] | TaskAssigneeType | null;
  reportedTo?: TaskAssigneeType | null;
  createdBy?: string;
  dueDate: string;
  taskCode: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AllTaskPayloadType = {
  workspaceId: string;
  projectId?: string | null;
  teamId?: string | null;
  keyword?: string | null;
  priority?: TaskPriorityEnumType | null;
  status?: TaskStatusEnumType | null;
  assignedTo?: string | null;
  dueDate?: string | null;
  pageNumber?: number | null;
  pageSize?: number | null;
};

export type AllTaskResponseType = {
  message: string;
  tasks: TaskType[];
  pagination: PaginationType;
};

// ********** TEAM TYPES ****************
export type TeamType = {
  _id: string;
  name: string;
  slug?: string;
  description?: string | null;
  workspaceId: string;
  projectId?: string | {
    _id: string;
    name: string;
    emoji?: string;
    description?: string | null;
  } | null;
  status: TeamStatusEnumType;
  createdBy?: {
    _id: string;
    name: string;
    email?: string;
    profilePicture?: string | null;
  } | null;
  membersCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type AllTeamsPayloadType = {
  workspaceId: string;
  keyword?: string | null;
  status?: string | null;
  projectId?: string | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  onlyMyTeams?: boolean;
};

export type AllTeamsResponseType = {
  message: string;
  teams: TeamType[];
  pagination: PaginationType;
};

export type CreateTeamPayloadType = {
  workspaceId: string;
  data: {
    name: string;
    projectId?: string;
    description?: string;
    status?: TeamStatusEnumType;
  };
};

export type EditTeamPayloadType = {
  workspaceId: string;
  teamId: string;
  data: Partial<{
    name: string;
    description?: string;
    status?: TeamStatusEnumType;
  }>;
};

export type TeamResponseType = {
  message: string;
  team: TeamType;
};

// ********** ASSOCIATION TYPES ****************
export type AssociationScopeType = "TEAM" | "PROJECT";
export type AssociationStatusType = "ACTIVE" | "REMOVED";

export type AssociationType = {
  _id: string;
  memberId: string;
  workspaceId: string;
  scopeType: AssociationScopeType;
  scopeId: string;
  role: AssociationRoleType;
  status: AssociationStatusType;
  joinedAt?: string;
  scopeDetails?: {
    name?: string;
    slug?: string;
    description?: string;
    status?: string;
    emoji?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type MyAssociationsResponseType = {
  message: string;
  associations: AssociationType[];
  totalCount: number;
};

export type ScopeMemberType = {
  _id: string;
  memberId: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      profilePicture?: string;
    };
    role?: {
      _id: string;
      name: string;
    };
  };
  workspaceId: string;
  scopeType: AssociationScopeType;
  scopeId: string;
  role: AssociationRoleType;
  status: AssociationStatusType;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ScopeMembersResponseType = {
  message: string;
  members: ScopeMemberType[];
  totalCount: number;
  scopeType: AssociationScopeType;
  scopeId: string;
  roleStats: Record<AssociationRoleType, number>;
  createdBy?: string;
};

export type AssignMemberPayloadType = {
  workspaceId: string;
  scopeType: AssociationScopeType;
  scopeId: string;
  memberId?: string;
  userId?: string;
  role: AssociationRoleType;
};

export type UpdateMemberRolePayloadType = {
  workspaceId: string;
  scopeType: AssociationScopeType;
  scopeId: string;
  memberId?: string;
  userId?: string;
  role: AssociationRoleType;
};

export type RemoveMemberPayloadType = {
  workspaceId: string;
  scopeType: AssociationScopeType;
  scopeId: string;
  memberId?: string;
  userId?: string;
};

export type AvailableMemberItemType = {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string | null;
  };
  role: {
    _id: string;
    name: string;
  };
  joinedAt?: string | Date;
};

export type AvailableMembersResponseType = {
  message: string;
  members: AvailableMemberItemType[];
  totalCount: number;
  isCurrentUserJoined: boolean;
  joinedVia: "TEAM" | "DIRECT" | null;
};

