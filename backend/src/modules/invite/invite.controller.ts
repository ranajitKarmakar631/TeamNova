import { Request, Response } from "express";
import { asyncHandler } from "../../common/middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import {
  acceptInviteSchema,
  createEmailInviteSchema,
  createLinkInviteSchema,
  revokeInviteParamSchema,
  tokenParamSchema,
  workspaceIdParamSchema,
} from "./invite.validation";
import {
  acceptInvitationService,
  createWorkspaceEmailInviteService,
  createWorkspaceLinkInviteService,
  getInvitationDetailsService,
  getWorkspaceInvitationsService,
  revokeInvitationService,
} from "./invite.service";
import { getMemberRoleInWorkspace } from "../member/member.service";
import { Permissions } from "../../common/enums/association.enum";
import { roleGuard } from "../../common/utils/roleGuard";

export const createWorkspaceLinkController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = createLinkInviteSchema.parse(req.body);
    const userId = req.user?._id?.toString()!;

    const { role } = await getMemberRoleInWorkspace(userId, body.workspaceId);
    roleGuard(role, [Permissions.INVITE_MEMBER]);

    const result = await createWorkspaceLinkInviteService(
      body.workspaceId,
      userId,
      body
    );

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Workspace invite link generated successfully",
      ...result,
    });
  }
);

export const createWorkspaceEmailController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = createEmailInviteSchema.parse(req.body);
    const userId = req.user?._id?.toString()!;

    const { role } = await getMemberRoleInWorkspace(userId, body.workspaceId);
    roleGuard(role, [Permissions.INVITE_MEMBER]);

    const result = await createWorkspaceEmailInviteService(
      body.workspaceId,
      userId,
      body
    );

    return res.status(HTTPSTATUS.CREATED).json({
      message: `Invitation email sent successfully to ${body.email}`,
      ...result,
    });
  }
);

export const getInviteDetailsController = asyncHandler(
  async (req: Request, res: Response) => {
    const token =
      req.params.token || (req.query.token as string) || (req.body?.token as string);
    const parsed = tokenParamSchema.parse({ token });

    const details = await getInvitationDetailsService(parsed.token);

    return res.status(HTTPSTATUS.OK).json({
      message: "Invitation details retrieved successfully",
      ...details,
    });
  }
);

export const acceptInviteController = asyncHandler(
  async (req: Request, res: Response) => {
    const token =
      req.body?.token || req.params.token || (req.query.token as string);
    const parsed = acceptInviteSchema.parse({ token });
    const userId = req.user?._id?.toString()!;

    const result = await acceptInvitationService(userId, parsed.token);

    return res.status(HTTPSTATUS.OK).json({
      message: "Successfully joined the workspace",
      ...result,
    });
  }
);

export const getWorkspaceInvitationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const userId = req.user?._id?.toString()!;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.INVITE_MEMBER]);

    const result = await getWorkspaceInvitationsService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace invitations fetched successfully",
      ...result,
    });
  }
);

export const revokeInviteController = asyncHandler(
  async (req: Request, res: Response) => {
    const { workspaceId, invitationId } = revokeInviteParamSchema.parse(
      req.params
    );
    const userId = req.user?._id?.toString()!;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.INVITE_MEMBER]);

    const result = await revokeInvitationService(workspaceId, invitationId);

    return res.status(HTTPSTATUS.OK).json(result);
  }
);