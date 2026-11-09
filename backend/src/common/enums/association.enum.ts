export const RoleType = {
  WORKSPACE: "WORKSPACE",
  ASSOCIATION: "ASSOCIATION",
} as const;

export type RoleTypeValue =
  (typeof RoleType)[keyof typeof RoleType];

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

export const AssociationScope = {
  TEAM: "TEAM",
  PROJECT: "PROJECT",
} as const;

export type AssociationScopeType =
  (typeof AssociationScope)[keyof typeof AssociationScope];

export const WorkspaceRolePriority: Record<WorkspaceRoleType, number> = {
  [WorkspaceRoles.EMPLOYEE]: 1,
  [WorkspaceRoles.MANAGER]: 2,
  [WorkspaceRoles.ADMIN]: 3,
  [WorkspaceRoles.OWNER]: 4,
};

export const AssociationRolePriority: Record<AssociationRoleType, number> = {
  [AssociationRoles.MEMBER]: 1,
  [AssociationRoles.LEAD]: 2,
  [AssociationRoles.HEAD]: 3,
};

// Backward-compatibility umbrella object
export const Roles = {
  ...WorkspaceRoles,
  ...AssociationRoles,
} as const;

export type AllRoleType = WorkspaceRoleType | AssociationRoleType;

export const Permissions = {
  // Workspace
  WORKSPACE_READ: "workspace:read",
  WORKSPACE_UPDATE: "workspace:update",
  WORKSPACE_DELETE: "workspace:delete",
  WORKSPACE_MANAGE: "workspace:manage",

  // Members
  MEMBER_READ: "member:read",
  MEMBER_CREATE: "member:create",
  MEMBER_UPDATE: "member:update",
  MEMBER_DELETE: "member:delete",

  // Teams
  TEAM_READ: "team:read",
  TEAM_CREATE: "team:create",
  TEAM_UPDATE: "team:update",
  TEAM_DELETE: "team:delete",
  TEAM_MANAGE: "team:manage",

  // Projects
  PROJECT_READ: "project:read",
  PROJECT_CREATE: "project:create",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",

  // Tasks
  TASK_READ: "task:read",
  TASK_CREATE: "task:create",
  TASK_UPDATE: "task:update",
  TASK_DELETE: "task:delete",

  // INVITE
  INVITE_MEMBER: "invite:member",

  // Meetings
  MEETING_CREATE: "meeting:create",
  MEETING_CREATE_WORKSPACE: "meeting:create_workspace",
  MEETING_CREATE_PROJECT: "meeting:create_project",
  MEETING_CREATE_TEAM: "meeting:create_team",
  MEETING_CREATE_CUSTOM: "meeting:create_custom",
  MEETING_UPDATE: "meeting:update",
  MEETING_CANCEL: "meeting:cancel",
  MEETING_MANAGE_ATTENDEES: "meeting:manage_attendees",
  MEETING_MANAGE_AGENDA: "meeting:manage_agenda",
  MEETING_ADD_DISCUSSION_TOPIC: "meeting:add_discussion_topic",
  MEETING_MANAGE_MINUTES: "meeting:manage_minutes",
  MEETING_MANAGE_ACTION_ITEMS: "meeting:manage_action_items",
} as const;

export type PermissionType =
  (typeof Permissions)[keyof typeof Permissions];

export const PlatformPermissions = {
  WORKSPACE_CREATE: "workspace:create",
} as const;

export type PlatformPermissionType =
  (typeof PlatformPermissions)[keyof typeof PlatformPermissions];

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

    Permissions.MEETING_CREATE,
    Permissions.MEETING_CREATE_WORKSPACE,
    Permissions.MEETING_CREATE_PROJECT,
    Permissions.MEETING_CREATE_TEAM,
    Permissions.MEETING_CREATE_CUSTOM,
    Permissions.MEETING_UPDATE,
    Permissions.MEETING_CANCEL,
    Permissions.MEETING_MANAGE_ATTENDEES,
    Permissions.MEETING_MANAGE_AGENDA,
    Permissions.MEETING_ADD_DISCUSSION_TOPIC,
    Permissions.MEETING_MANAGE_MINUTES,
    Permissions.MEETING_MANAGE_ACTION_ITEMS,
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

    Permissions.MEETING_CREATE,
    Permissions.MEETING_CREATE_WORKSPACE,
    Permissions.MEETING_CREATE_PROJECT,
    Permissions.MEETING_CREATE_TEAM,
    Permissions.MEETING_CREATE_CUSTOM,
    Permissions.MEETING_UPDATE,
    Permissions.MEETING_CANCEL,
    Permissions.MEETING_MANAGE_ATTENDEES,
    Permissions.MEETING_MANAGE_AGENDA,
    Permissions.MEETING_ADD_DISCUSSION_TOPIC,
    Permissions.MEETING_MANAGE_MINUTES,
    Permissions.MEETING_MANAGE_ACTION_ITEMS,
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

    Permissions.MEETING_CREATE,
    Permissions.MEETING_CREATE_WORKSPACE,
    Permissions.MEETING_CREATE_PROJECT,
    Permissions.MEETING_CREATE_TEAM,
    Permissions.MEETING_CREATE_CUSTOM,
    Permissions.MEETING_UPDATE,
    Permissions.MEETING_CANCEL,
    Permissions.MEETING_MANAGE_ATTENDEES,
    Permissions.MEETING_MANAGE_AGENDA,
    Permissions.MEETING_ADD_DISCUSSION_TOPIC,
    Permissions.MEETING_MANAGE_MINUTES,
    Permissions.MEETING_MANAGE_ACTION_ITEMS,
  ],

  [WorkspaceRoles.EMPLOYEE]: [
    Permissions.WORKSPACE_READ,

    Permissions.MEMBER_READ,

    Permissions.TEAM_READ,

    Permissions.PROJECT_READ,

    Permissions.TASK_READ,
    Permissions.TASK_CREATE,
    Permissions.TASK_UPDATE,

    Permissions.MEETING_CREATE,
    Permissions.MEETING_CREATE_CUSTOM,
    Permissions.MEETING_ADD_DISCUSSION_TOPIC,
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

    Permissions.MEETING_CREATE,
    Permissions.MEETING_CREATE_PROJECT,
    Permissions.MEETING_CREATE_TEAM,
    Permissions.MEETING_UPDATE,
    Permissions.MEETING_CANCEL,
    Permissions.MEETING_MANAGE_ATTENDEES,
    Permissions.MEETING_MANAGE_AGENDA,
    Permissions.MEETING_ADD_DISCUSSION_TOPIC,
    Permissions.MEETING_MANAGE_MINUTES,
    Permissions.MEETING_MANAGE_ACTION_ITEMS,
  ],

  [AssociationRoles.LEAD]: [
    Permissions.TEAM_READ,
    Permissions.TEAM_UPDATE,

    Permissions.PROJECT_READ,

    Permissions.TASK_READ,
    Permissions.TASK_CREATE,
    Permissions.TASK_UPDATE,

    Permissions.MEETING_CREATE,
    Permissions.MEETING_CREATE_PROJECT,
    Permissions.MEETING_CREATE_TEAM,
    Permissions.MEETING_UPDATE,
    Permissions.MEETING_MANAGE_ATTENDEES,
    Permissions.MEETING_MANAGE_AGENDA,
    Permissions.MEETING_ADD_DISCUSSION_TOPIC,
    Permissions.MEETING_MANAGE_MINUTES,
    Permissions.MEETING_MANAGE_ACTION_ITEMS,
  ],

  [AssociationRoles.MEMBER]: [
    Permissions.TEAM_READ,

    Permissions.PROJECT_READ,

    Permissions.TASK_READ,
    Permissions.TASK_CREATE,
    Permissions.TASK_UPDATE,

    Permissions.MEETING_ADD_DISCUSSION_TOPIC,
  ],
};