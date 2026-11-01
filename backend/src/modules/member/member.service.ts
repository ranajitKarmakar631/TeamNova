import { ErrorCodeEnum } from "../../common/enums/error-code.enum";
import { Roles } from "../../common/enums/role.enum";
import MemberModel from "./member.model";
import RoleModel from "./role-permission.model";
import WorkspaceModel from "../workspace/workspace.model";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../../common/utils/appError";

export const getMemberRoleInWorkspace = async (
  userId: string,
  workspaceId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const member = await MemberModel.findOne({
    userId,
    workspaceId,
  }).populate("role");

  if (!member) {
    throw new UnauthorizedException(
      "You are not a member of this workspace",
      ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );
  }

  const roleName = member.role?.name;

  return { role: roleName };
};

import { acceptInvitationService } from "../invite/invite.service";

export const joinWorkspaceByInviteService = async (
  userId: string,
  inviteCode: string
) => {
  return acceptInvitationService(userId, inviteCode);
};

