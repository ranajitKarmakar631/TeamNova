import crypto from "crypto";
import { Types } from "mongoose";
import WorkspaceInvitation, {
  IWorkspaceInvitation,
  InvitationRoleType,
} from "./invite.model";
import WorkspaceModel from "../workspace/workspace.model";
import UserModel from "../user/user.model";
import MemberModel from "../member/member.model";
import RoleModel from "../member/role-permission.model";
import { config } from "../../config/app.config";
import { sendInvitationEmail } from "../../config/sendMail";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/utils/appError";
import {
  Roles,
  WorkspaceRoles,
  WorkspaceRoleType,
} from "../../common/enums/association.enum";
import {
  CreateEmailInviteInput,
  CreateLinkInviteInput,
} from "./invite.validation";

export const hashToken = (rawToken: string): string => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

export const generateRawToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const createWorkspaceLinkInviteService = async (
  workspaceId: string,
  userId: string,
  data: Partial<CreateLinkInviteInput>
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const role = (data.role || WorkspaceRoles.EMPLOYEE) as InvitationRoleType;
  if (![WorkspaceRoles.ADMIN, WorkspaceRoles.MANAGER, WorkspaceRoles.EMPLOYEE].includes(role)) {
    throw new BadRequestException("Invalid invitation role");
  }

  const expiresInDays = Number(data.expiresInDays) || 7;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);

  const invitation = await WorkspaceInvitation.create({
    workspaceId: new Types.ObjectId(workspaceId),
    invitedBy: new Types.ObjectId(userId),
    method: "LINK",
    tokenHash,
    role,
    status: "PENDING",
    expiresAt,
    maxUses: data.maxUses ? Number(data.maxUses) : undefined,
    usedCount: 0,
  });

  const inviteUrl = `${config.FRONTEND_ORIGIN}/invite/workspace/${rawToken}/join`;

  return {
    invitation,
    token: rawToken,
    inviteUrl,
  };
};

export const LinkInviteUserService = createWorkspaceLinkInviteService;

export const createWorkspaceEmailInviteService = async (
  workspaceId: string,
  userId: string,
  data: CreateEmailInviteInput
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const normalizedEmail = data.email.toLowerCase().trim();

  const existingUser = await UserModel.findOne({ email: normalizedEmail });
  if (existingUser) {
    if (existingUser._id.toString() === userId.toString()) {
      throw new BadRequestException("You cannot invite yourself to the workspace");
    }

    const existingMember = await MemberModel.findOne({
      userId: existingUser._id,
      workspaceId,
    });
    if (existingMember) {
      throw new BadRequestException(
        "User with this email is already a member of this workspace"
      );
    }
  }

  const role = (data.role || WorkspaceRoles.EMPLOYEE) as InvitationRoleType;
  if (![WorkspaceRoles.ADMIN, WorkspaceRoles.MANAGER, WorkspaceRoles.EMPLOYEE].includes(role)) {
    throw new BadRequestException("Invalid invitation role");
  }

  await WorkspaceInvitation.updateMany(
    {
      workspaceId,
      email: normalizedEmail,
      status: "PENDING",
    },
    {
      status: "REVOKED",
    }
  );

  const expiresInDays = Number(data.expiresInDays) || 7;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);

  const invitation = await WorkspaceInvitation.create({
    workspaceId: new Types.ObjectId(workspaceId),
    invitedBy: new Types.ObjectId(userId),
    method: "EMAIL",
    email: normalizedEmail,
    tokenHash,
    role,
    status: "PENDING",
    expiresAt,
    maxUses: 1,
    usedCount: 0,
  });

  const inviteUrl = `${config.FRONTEND_ORIGIN}/invite/workspace/${rawToken}/join`;

  const inviter = await UserModel.findById(userId);
  const inviterName = inviter?.name || "A workspace team member";

  try {
    await sendInvitationEmail({
      to: normalizedEmail,
      inviterName,
      workspaceName: workspace.name,
      role: invitation.role,
      inviteUrl,
      expiresInDays,
    });
  } catch (error) {
    console.error("Failed to send invitation email:", error);
  }

  return {
    invitation,
    token: rawToken,
    inviteUrl,
  };
};

export const getInvitationDetailsService = async (token: string) => {
  const tokenHash = hashToken(token);

  const invitation = await WorkspaceInvitation.findOne({ tokenHash })
    .populate("workspaceId", "name description")
    .populate("invitedBy", "name email");

  if (!invitation) {
    const workspace = await WorkspaceModel.findOne({ inviteCode: token });
    if (workspace) {
      return {
        isLegacyCode: true,
        workspace: {
          _id: workspace._id,
          name: workspace.name,
          description: workspace.description,
        },
        role: WorkspaceRoles.EMPLOYEE,
        method: "LINK",
        status: "PENDING",
      };
    }

    throw new NotFoundException("Invalid or non-existent invitation");
  }

  if (invitation.status === "REVOKED") {
    throw new BadRequestException("This invitation has been revoked");
  }

  if (invitation.status === "EXPIRED" || new Date() > invitation.expiresAt) {
    if (invitation.status !== "EXPIRED") {
      invitation.status = "EXPIRED";
      await invitation.save();
    }
    throw new BadRequestException("This invitation has expired");
  }

  if (invitation.maxUses && invitation.usedCount >= invitation.maxUses) {
    throw new BadRequestException(
      "This invitation link has reached its maximum usage limit"
    );
  }

  if (invitation.method === "EMAIL" && invitation.status === "ACCEPTED") {
    throw new BadRequestException(
      "This invitation has already been accepted"
    );
  }

  return {
    isLegacyCode: false,
    workspace: invitation.workspaceId,
    inviter: invitation.invitedBy,
    role: invitation.role,
    method: invitation.method,
    email: invitation.email,
    expiresAt: invitation.expiresAt,
    status: invitation.status,
  };
};

export const acceptInvitationService = async (
  userId: string,
  token: string
) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new NotFoundException("User not found");
  }

  const tokenHash = hashToken(token);
  const invitation = await WorkspaceInvitation.findOne({ tokenHash });

  if (!invitation) {
    const workspace = await WorkspaceModel.findOne({ inviteCode: token }).exec();
    if (workspace) {
      const existingMember = await MemberModel.findOne({
        userId,
        workspaceId: workspace._id,
      }).exec();

      if (existingMember) {
        throw new BadRequestException(
          "You are already a member of this workspace"
        );
      }

      let role = await RoleModel.findOne({ name: Roles.EMPLOYEE });
      if (!role) {
        role = await RoleModel.findOne({ name: Roles.MEMBER });
      }
      if (!role) {
        throw new NotFoundException("Role not found");
      }

      const newMember = await MemberModel.create({
        userId,
        workspaceId: workspace._id,
        role: role._id,
      });

      user.currentWorkspace = workspace._id;
      await user.save();

      return {
        workspaceId: workspace._id,
        role: role.name,
        memberId: newMember._id,
      };
    }

    throw new NotFoundException("Invalid or non-existent invitation");
  }

  if (invitation.status === "REVOKED") {
    throw new BadRequestException("This invitation has been revoked");
  }

  if (invitation.status === "EXPIRED" || new Date() > invitation.expiresAt) {
    if (invitation.status !== "EXPIRED") {
      invitation.status = "EXPIRED";
      await invitation.save();
    }
    throw new BadRequestException("This invitation has expired");
  }

  if (invitation.maxUses && invitation.usedCount >= invitation.maxUses) {
    throw new BadRequestException(
      "This invitation link has reached its maximum usage limit"
    );
  }

  // Check email-specific validation
  if (invitation.method === "EMAIL") {
    if (invitation.status === "ACCEPTED") {
      throw new BadRequestException("This invitation has already been accepted");
    }

    if (
      invitation.email &&
      user.email.toLowerCase() !== invitation.email.toLowerCase()
    ) {
      throw new BadRequestException(
        `This invitation was sent to ${invitation.email}. Please sign in with that account to accept it.`
      );
    }
  }

  // Check if user is already a member
  const existingMember = await MemberModel.findOne({
    userId,
    workspaceId: invitation.workspaceId,
  });

  if (existingMember) {
    throw new BadRequestException(
      "You are already a member of this workspace"
    );
  }

  // Resolve Role
  let roleDoc = await RoleModel.findOne({ name: invitation.role });
  if (!roleDoc) {
    roleDoc = await RoleModel.findOne({ name: WorkspaceRoles.EMPLOYEE });
  }
  if (!roleDoc) {
    roleDoc = await RoleModel.findOne({ name: Roles.MEMBER });
  }
  if (!roleDoc) {
    throw new NotFoundException(`Role ${invitation.role} not found in database`);
  }

  // Create member record
  const newMember = await MemberModel.create({
    userId,
    workspaceId: invitation.workspaceId,
    role: roleDoc._id,
  });

  // Update invitation record
  invitation.usedCount = (invitation.usedCount || 0) + 1;
  if (!invitation.acceptedBy) {
    invitation.acceptedBy = [];
  }
  invitation.acceptedBy.push(user._id);

  if (
    invitation.method === "EMAIL" ||
    (invitation.maxUses && invitation.usedCount >= invitation.maxUses)
  ) {
    invitation.status = "ACCEPTED";
    invitation.acceptedAt = new Date();
  }

  await invitation.save();

  // Set user's currentWorkspace
  user.currentWorkspace = invitation.workspaceId;
  await user.save();

  return {
    workspaceId: invitation.workspaceId,
    role: invitation.role,
    memberId: newMember._id,
  };
};

export const getWorkspaceInvitationsService = async (workspaceId: string) => {
  const invitations = await WorkspaceInvitation.find({ workspaceId })
    .populate("invitedBy", "name email profilePicture")
    .sort({ createdAt: -1 });

  return { invitations };
};

export const revokeInvitationService = async (
  workspaceId: string,
  invitationId: string
) => {
  const invitation = await WorkspaceInvitation.findOne({
    _id: invitationId,
    workspaceId,
  });

  if (!invitation) {
    throw new NotFoundException("Invitation not found");
  }

  invitation.status = "REVOKED";
  await invitation.save();

  return { message: "Invitation revoked successfully" };
};
