import { AssociationRoleType } from "@/constant";
import { AssociationScopeType } from "./types/association.types";

export const associationKeys = {
  all: ["associations"] as const,
  myAssociations: (workspaceId: string) => ["my-associations", workspaceId] as const,
  scopeMembers: (
    scopeType: AssociationScopeType,
    scopeId?: string,
    workspaceId?: string,
    status?: string,
    role?: AssociationRoleType,
    search?: string
  ) =>
    [
      "scope-members",
      scopeType,
      scopeId,
      workspaceId,
      status,
      role,
      search,
    ].filter((v) => v !== undefined),
  availableScopeMembers: (
    scopeType?: AssociationScopeType,
    scopeId?: string,
    workspaceId?: string,
    search?: string
  ) =>
    [
      "available-scope-members",
      scopeType,
      scopeId,
      workspaceId,
      search,
    ].filter((v) => v !== undefined),
};
