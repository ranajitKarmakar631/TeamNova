export const TaskStatusEnum = {
  BACKLOG: "BACKLOG",
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  DONE: "DONE",
} as const;

export const TaskPriorityEnum = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;
export type TaskStatusEnumType = keyof typeof TaskStatusEnum;
export type TaskPriorityEnumType = keyof typeof TaskPriorityEnum;

export const TeamStatusEnum = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  INACTIVE: "INACTIVE",
} as const;
export type TeamStatusEnumType = keyof typeof TeamStatusEnum;

export const WorkspaceRoles = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type WorkspaceRoleType =
  (typeof WorkspaceRoles)[keyof typeof WorkspaceRoles];

export const AssociationRoles = {
  HEAD: "HEAD",
  LEAD: "LEAD",
  MEMBER: "MEMBER",
} as const;

export type AssociationRoleType =
  (typeof AssociationRoles)[keyof typeof AssociationRoles];

export const Roles = {
  ...WorkspaceRoles,
  ...AssociationRoles,
} as const;

export type AllRoleType = WorkspaceRoleType | AssociationRoleType;

export const Permissions = {
  // Association / Canonical Permissions
  WORKSPACE_READ: "workspace:read",
  WORKSPACE_UPDATE: "workspace:update",
  WORKSPACE_DELETE: "workspace:delete",
  WORKSPACE_MANAGE: "workspace:manage",

  MEMBER_READ: "member:read",
  MEMBER_CREATE: "member:create",
  MEMBER_UPDATE: "member:update",
  MEMBER_DELETE: "member:delete",

  TEAM_READ: "team:read",
  TEAM_CREATE: "team:create",
  TEAM_UPDATE: "team:update",
  TEAM_DELETE: "team:delete",
  TEAM_MANAGE: "team:manage",

  PROJECT_READ: "project:read",
  PROJECT_CREATE: "project:create",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",

  TASK_READ: "task:read",
  TASK_CREATE: "task:create",
  TASK_UPDATE: "task:update",
  TASK_DELETE: "task:delete",

  INVITE_MEMBER: "invite:member",

  CREATE_WORKSPACE: "workspace:manage",
  DELETE_WORKSPACE: "workspace:delete",
  EDIT_WORKSPACE: "workspace:update",
  MANAGE_WORKSPACE_SETTINGS: "workspace:manage",

  ADD_MEMBER: "member:create",
  CHANGE_MEMBER_ROLE: "member:update",
  REMOVE_MEMBER: "member:delete",

  CREATE_PROJECT: "project:create",
  EDIT_PROJECT: "project:update",
  DELETE_PROJECT: "project:delete",

  CREATE_TASK: "task:create",
  EDIT_TASK: "task:update",
  DELETE_TASK: "task:delete",

  VIEW_ONLY: "workspace:read",
} as const;

export type PermissionType =
  (typeof Permissions)[keyof typeof Permissions];

export const WorkspaceRolePermissions: Record<
  WorkspaceRoleType,
  readonly PermissionType[]
> = {
  [WorkspaceRoles.OWNER]: [
    Permissions.WORKSPACE_READ,
    Permissions.WORKSPACE_UPDATE,
    Permissions.WORKSPACE_DELETE,
    Permissions.WORKSPACE_MANAGE,

    Permissions.MEMBER_READ,
    Permissions.MEMBER_CREATE,
    Permissions.MEMBER_UPDATE,
    Permissions.MEMBER_DELETE,

    Permissions.TEAM_READ,
    Permissions.TEAM_CREATE,
    Permissions.TEAM_UPDATE,
    Permissions.TEAM_DELETE,
    Permissions.TEAM_MANAGE,

    Permissions.PROJECT_READ,
    Permissions.PROJECT_CREATE,
    Permissions.PROJECT_UPDATE,
    Permissions.PROJECT_DELETE,

    Permissions.TASK_READ,
    Permissions.TASK_CREATE,
    Permissions.TASK_UPDATE,
    Permissions.TASK_DELETE,

    Permissions.INVITE_MEMBER,
  ],

  [WorkspaceRoles.ADMIN]: [
    Permissions.WORKSPACE_READ,
    Permissions.WORKSPACE_UPDATE,
    Permissions.WORKSPACE_MANAGE,

    Permissions.MEMBER_READ,
    Permissions.MEMBER_CREATE,
    Permissions.MEMBER_UPDATE,
    Permissions.MEMBER_DELETE,

    Permissions.TEAM_READ,
    Permissions.TEAM_CREATE,
    Permissions.TEAM_UPDATE,
    Permissions.TEAM_DELETE,
    Permissions.TEAM_MANAGE,

    Permissions.PROJECT_READ,
    Permissions.PROJECT_CREATE,
    Permissions.PROJECT_UPDATE,
    Permissions.PROJECT_DELETE,

    Permissions.TASK_READ,
    Permissions.TASK_CREATE,
    Permissions.TASK_UPDATE,
    Permissions.TASK_DELETE,

    Permissions.INVITE_MEMBER,
  ],

  [WorkspaceRoles.MANAGER]: [
    Permissions.WORKSPACE_READ,

    Permissions.MEMBER_READ,

    Permissions.TEAM_READ,
    Permissions.TEAM_CREATE,
    Permissions.TEAM_UPDATE,
    Permissions.TEAM_MANAGE,

    Permissions.PROJECT_READ,

    Permissions.TASK_READ,
    Permissions.TASK_CREATE,
    Permissions.TASK_UPDATE,
    Permissions.TASK_DELETE,
  ],

  [WorkspaceRoles.EMPLOYEE]: [
    Permissions.WORKSPACE_READ,

    Permissions.MEMBER_READ,

    Permissions.TEAM_READ,

    Permissions.PROJECT_READ,

    Permissions.TASK_READ,
    Permissions.TASK_CREATE,
    Permissions.TASK_UPDATE,
  ],
};

export const AssociationRolePermissions: Record<
  AssociationRoleType,
  readonly PermissionType[]
> = {
  [AssociationRoles.HEAD]: [
    Permissions.TEAM_READ,
    Permissions.TEAM_UPDATE,
    Permissions.TEAM_MANAGE,

    Permissions.PROJECT_READ,
    Permissions.PROJECT_UPDATE,

    Permissions.TASK_READ,
    Permissions.TASK_CREATE,
    Permissions.TASK_UPDATE,
    Permissions.TASK_DELETE,
  ],

  [AssociationRoles.LEAD]: [
    Permissions.TEAM_READ,
    Permissions.TEAM_UPDATE,

    Permissions.PROJECT_READ,

    Permissions.TASK_READ,
    Permissions.TASK_CREATE,
    Permissions.TASK_UPDATE,
  ],

  [AssociationRoles.MEMBER]: [
    Permissions.TEAM_READ,

    Permissions.PROJECT_READ,

    Permissions.TASK_READ,
    Permissions.TASK_CREATE,
    Permissions.TASK_UPDATE,
  ],
};

