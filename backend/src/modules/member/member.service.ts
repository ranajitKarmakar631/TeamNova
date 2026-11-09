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
import { redis } from "../../redis/redis.service";
import { REDIS_KEYS, REDIS_TTL } from "../../redis/redis.keys";
import { acceptInvitationService } from "../invite/invite.service";

export const getMemberRoleInWorkspace = async (
  userId: string,
  workspaceId: string
) => {
  const roleKey = REDIS_KEYS.WORKSPACE_MEMBER_ROLE(workspaceId, userId);

  // 1. Check Redis for cached membership role
  try {
    const cachedRole = await redis.get(roleKey);
    if (cachedRole) {
      if (cachedRole === "__NOT_MEMBER__") {
        throw new UnauthorizedException(
          "You are not a member of this workspace",
          ErrorCodeEnum.ACCESS_UNAUTHORIZED
        );
      }
      return { role: cachedRole };
    }
  } catch (err) {
    if (err instanceof UnauthorizedException) throw err;
    console.warn("[Redis] Failed to read member role cache:", err);
  }

  // 2. Validate workspace existence (cached in Redis)
  const workspaceExistsKey = REDIS_KEYS.WORKSPACE_EXISTS(workspaceId);
  let workspaceExists = false;
  try {
    const cachedExists = await redis.get(workspaceExistsKey);
    if (cachedExists === "1") {
      workspaceExists = true;
    }
  } catch (err) {
    console.warn("[Redis] Failed to check workspace existence cache:", err);
  }

  if (!workspaceExists) {
    const workspace = await WorkspaceModel.exists({ _id: workspaceId });
    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }
    try {
      await redis.set(workspaceExistsKey, "1", "EX", REDIS_TTL.LONG);
    } catch (err) {
      console.warn("[Redis] Failed to cache workspace existence:", err);
    }
  }

  // 3. Query membership & role from MongoDB
  const member = await MemberModel.findOne({
    userId,
    workspaceId,
  }).populate("role").lean();

  if (!member || !member.role) {
    try {
      await redis.set(roleKey, "__NOT_MEMBER__", "EX", REDIS_TTL.NEGATIVE);
    } catch (err) {
      console.warn("[Redis] Failed to set negative member role cache:", err);
    }
    throw new UnauthorizedException(
      "You are not a member of this workspace",
      ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );
  }

  const roleName = (member.role as any)?.name;

  try {
    await redis.set(roleKey, roleName, "EX", REDIS_TTL.ROLE);
  } catch (err) {
    console.warn("[Redis] Failed to cache member role:", err);
  }

  return { role: roleName };
};

export const joinWorkspaceByInviteService = async (
  userId: string,
  inviteCode: string
) => {
  return acceptInvitationService(userId, inviteCode);
};
