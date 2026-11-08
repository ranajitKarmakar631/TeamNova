import { z } from "zod";
import { WorkspaceRoles } from "../../common/enums/association.enum";

export const createLinkInviteSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  role: z
    .enum([
      WorkspaceRoles.ADMIN,
      WorkspaceRoles.MANAGER,
      WorkspaceRoles.EMPLOYEE,
    ])
    .default(WorkspaceRoles.EMPLOYEE),
  maxUses: z.coerce.number().int().min(1).optional().nullable(),
  expiresInDays: z.coerce.number().int().min(1).max(3650).default(7),
});

export const createEmailInviteSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  email: z.string().trim().email("Invalid email address"),
  role: z
    .enum([
      WorkspaceRoles.ADMIN,
      WorkspaceRoles.MANAGER,
      WorkspaceRoles.EMPLOYEE,
    ])
    .default(WorkspaceRoles.EMPLOYEE),
  expiresInDays: z.coerce.number().int().min(1).max(3650).default(7),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});

export const tokenParamSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});

export const workspaceIdParamSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const revokeInviteParamSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  invitationId: z.string().min(1, "Invitation ID is required"),
});

export type CreateLinkInviteInput = z.infer<typeof createLinkInviteSchema>;
export type CreateEmailInviteInput = z.infer<typeof createEmailInviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
