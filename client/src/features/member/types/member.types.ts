export type RoleType = {
  _id: string;
  name: string;
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

