import { z } from "zod";
import {
  AssociationRoles,
  AssociationScope,
  AssociationRoleType,
  AssociationScopeType,
} from "../../common/enums/association.enum";
import { AssociationStatus, AssociationStatusType } from "./association.model";

export const scopeTypeSchema = z.nativeEnum(AssociationScope as any).or(
  z.enum([AssociationScope.TEAM, AssociationScope.PROJECT])
) as z.ZodType<AssociationScopeType>;

export const roleSchema = z.nativeEnum(AssociationRoles as any).or(
  z.enum([
    AssociationRoles.HEAD,
    AssociationRoles.LEAD,
    AssociationRoles.MEMBER,
  ])
) as z.ZodType<AssociationRoleType>;

export const statusSchema = z.enum([
  AssociationStatus.ACTIVE,
  AssociationStatus.REMOVED,
]) as z.ZodType<AssociationStatusType>;

export const assignMemberSchema = z
  .object({
    workspaceId: z.string().trim().min(1, "Workspace ID is required"),
    scopeType: scopeTypeSchema,
    scopeId: z.string().trim().min(1, "Scope ID is required"),
    memberId: z.string().trim().optional(),
    userId: z.string().trim().optional(),
    role: roleSchema.default(AssociationRoles.MEMBER),
  })
  .refine((data) => Boolean(data.memberId || data.userId), {
    message: "Either memberId or userId must be provided",
    path: ["memberId"],
  });

export const updateMemberRoleSchema = z
  .object({
    workspaceId: z.string().trim().min(1, "Workspace ID is required"),
    scopeType: scopeTypeSchema,
    scopeId: z.string().trim().min(1, "Scope ID is required"),
    memberId: z.string().trim().optional(),
    userId: z.string().trim().optional(),
    role: roleSchema,
  })
  .refine((data) => Boolean(data.memberId || data.userId), {
    message: "Either memberId or userId must be provided",
    path: ["memberId"],
  });

export const removeMemberSchema = z
  .object({
    workspaceId: z.string().trim().min(1, "Workspace ID is required"),
    scopeType: scopeTypeSchema,
    scopeId: z.string().trim().min(1, "Scope ID is required"),
    memberId: z.string().trim().optional(),
    userId: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.memberId || data.userId), {
    message: "Either memberId or userId must be provided",
    path: ["memberId"],
  });

export const updateAssociationByIdSchema = z.object({
  role: roleSchema.optional(),
  status: statusSchema.optional(),
});

export const getScopeMembersQuerySchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace ID is required"),
  status: statusSchema.optional().default(AssociationStatus.ACTIVE),
  role: roleSchema.optional(),
  search: z.string().trim().optional(),
});

export const getAvailableScopeMembersQuerySchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace ID is required"),
  search: z.string().trim().optional(),
});

export const getUserAssociationsQuerySchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace ID is required"),
  memberId: z.string().trim().optional(),
  userId: z.string().trim().optional(),
  scopeType: scopeTypeSchema.optional(),
  status: statusSchema.optional().default(AssociationStatus.ACTIVE),
});

export const scopeParamsSchema = z.object({
  scopeType: scopeTypeSchema,
  scopeId: z.string().trim().min(1, "Scope ID is required"),
});

export const associationIdParamSchema = z.object({
  id: z.string().trim().min(1, "Association ID is required"),
});

export type AssignMemberInput = z.infer<typeof assignMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type UpdateAssociationByIdInput = z.infer<typeof updateAssociationByIdSchema>;
export type GetScopeMembersQueryInput = z.infer<typeof getScopeMembersQuerySchema>;
export type GetUserAssociationsQueryInput = z.infer<typeof getUserAssociationsQuerySchema>;
