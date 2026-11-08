import { AssociationRoleType } from "@/constant";

export type { AssociationRoleType };
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
