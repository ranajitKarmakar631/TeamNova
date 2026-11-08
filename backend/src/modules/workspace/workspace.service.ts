import mongoose from "mongoose";
import { Roles, WorkspaceRoles } from "../../common/enums/role.enum";
import MemberModel from "../member/member.model";
import RoleModel from "../member/role-permission.model";
import UserModel from "../user/user.model";
import WorkspaceModel from "./workspace.model";
import { BadRequestException, NotFoundException } from "../../common/utils/appError";
import { TaskStatusEnum } from "../task/task.enum";
import ProjectModel from "../project/project.model";
import { TaskModel } from "../task";
import TeamModel from "../teams/teams.model";
import AssociationModel from "../association/association.model";
import WorkspaceInvitation from "../invite/invite.model";

//********************************
// CREATE NEW WORKSPACE
//**************** **************/
export const createWorkspaceService = async (
  userId: string,
  body: {
    name: string;
    description?: string | undefined;
  }
) => {
  const { name, description } = body;

  const user = await UserModel.findById(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  const ownerRole = await RoleModel.findOne({ name: Roles.OWNER });

  if (!ownerRole) {
    throw new NotFoundException("Owner role not found");
  }

  const workspace = new WorkspaceModel({
    name: name,
    description: description,
    owner: user._id,
  });

  await workspace.save();

  const member = new MemberModel({
    userId: user._id,
    workspaceId: workspace._id,
    role: ownerRole._id,
    joinedAt: new Date(),
  });

  await member.save();

  user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
  await user.save();

  return {
    workspace,
  };
};

//********************************
// GET WORKSPACES USER IS A MEMBER
//**************** **************/
export const getAllWorkspacesUserIsMemberService = async (userId: string) => {
  const memberships = await MemberModel.find({ userId })
    .populate("workspaceId")
    .select("-password")
    .exec();

  // Extract workspace details from memberships
  const workspaces = memberships.map((membership) => membership.workspaceId);

  return { workspaces };
};

export const getWorkspaceByIdService = async (workspaceId: string) => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const members = await MemberModel.find({
    workspaceId,
  }).populate("role");

  const workspaceWithMembers = {
    ...workspace.toObject(),
    members,
  };

  return {
    workspace: workspaceWithMembers,
  };
};


export const getWorkspaceMembersService = async (workspaceId: string) => {
  // Fetch all members of the workspace
  const members = await MemberModel.find({
    workspaceId,
  })
    .populate("userId", "name email profilePicture -password")
    .populate("role", "name");

  const roles = await RoleModel.find(
    {
      name: {
        $in: [
          WorkspaceRoles.OWNER,
          WorkspaceRoles.ADMIN,
          WorkspaceRoles.MANAGER,
          WorkspaceRoles.EMPLOYEE,
        ],
      },
    },
    { name: 1, _id: 1 }
  )
    .select("-permission")
    .lean();

  return { members, roles };
};

export const getWorkspaceAnalyticsService = async (workspaceId: string) => {
  const currentDate = new Date();

  const totalTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
  });

  const overdueTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
    dueDate: { $lt: currentDate },
    status: { $ne: TaskStatusEnum.DONE },
  });

  const completedTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
    status: TaskStatusEnum.DONE,
  });

  const analytics = {
    totalTasks,
    overdueTasks,
    completedTasks,
  };

  return { analytics };
};

export const changeMemberRoleService = async (
  workspaceId: string,
  memberId: string,
  roleId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const role = await RoleModel.findById(roleId);
  if (!role) {
    throw new NotFoundException("Role not found");
  }

  if (role.name === Roles.OWNER) {
    throw new BadRequestException("Cannot assign Owner role");
  }

  const query = mongoose.isValidObjectId(memberId)
    ? {
        workspaceId,
        $or: [{ _id: memberId }, { userId: memberId }],
      }
    : { workspaceId, userId: memberId };

  const member = await MemberModel.findOne(query);

  if (!member) {
    throw new NotFoundException("Member not found in the workspace");
  }

  const ownerId = workspace.owner || workspace.ownerId;
  if (ownerId && ownerId.toString() === member.userId.toString()) {
    throw new BadRequestException("Cannot change the role of the workspace owner");
  }

  member.role = role._id as any;
  await member.save();

  return {
    member,
  };
};

export const removeWorkspaceMemberService = async (
  workspaceId: string,
  memberId: string,
  currentUserId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const query = mongoose.isValidObjectId(memberId)
    ? {
        workspaceId,
        $or: [{ _id: memberId }, { userId: memberId }],
      }
    : { workspaceId, userId: memberId };

  const member = await MemberModel.findOne(query);
  if (!member) {
    throw new NotFoundException("Member not found in the workspace");
  }

  const ownerId = workspace.owner || workspace.ownerId;
  if (ownerId && ownerId.toString() === member.userId.toString()) {
    throw new BadRequestException("Cannot remove the owner of the workspace");
  }

  // 1. Delete member record
  await MemberModel.findByIdAndDelete(member._id);

  // 2. Cascade delete all associations for this member in this workspace
  await AssociationModel.deleteMany({
    workspaceId,
    memberId: member._id,
  });

  // 3. Unassign any tasks in this workspace assigned to this user
  await TaskModel.updateMany(
    { workspace: workspaceId, assignedTo: member.userId },
    { $set: { assignedTo: null } }
  );

  // 4. Update currentWorkspace if the removed user currently has this workspace active
  const targetUser = await UserModel.findById(member.userId);
  if (targetUser && targetUser.currentWorkspace?.toString() === workspaceId.toString()) {
    const anotherMembership = await MemberModel.findOne({ userId: member.userId });
    targetUser.currentWorkspace = anotherMembership
      ? (anotherMembership.workspaceId as any)
      : null;
    await targetUser.save();
  }

  return {
    message: "Member removed from workspace successfully",
  };
};

//********************************
// UPDATE WORKSPACE
//**************** **************/
export const updateWorkspaceByIdService = async (
  workspaceId: string,
  name: string,
  description?: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  // Update the workspace details
  workspace.name = name || workspace.name;
  workspace.description = description || workspace.description;
  await workspace.save();

  return {
    workspace,
  };
};

export const deleteWorkspaceService = async (
  workspaceId: string,
  userId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const ownerId = workspace.owner || workspace.ownerId;
  if (!ownerId || !ownerId.equals(new mongoose.Types.ObjectId(userId))) {
    throw new BadRequestException(
      "You are not authorized to delete this workspace"
    );
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new NotFoundException("User not found");
  }

  await ProjectModel.deleteMany({ workspace: workspace._id });
  await TaskModel.deleteMany({ workspace: workspace._id });
  await TeamModel.deleteMany({ workspaceId: workspace._id });
  await AssociationModel.deleteMany({ workspaceId: workspace._id });
  await WorkspaceInvitation.deleteMany({ workspaceId: workspace._id });
  await MemberModel.deleteMany({
    workspaceId: workspace._id,
  });

  if (user?.currentWorkspace?.equals(workspaceId)) {
    const memberWorkspace = await MemberModel.findOne({ userId });
    user.currentWorkspace = memberWorkspace
      ? memberWorkspace.workspaceId
      : null;

    await user.save();
  }

  await workspace.deleteOne();

  return {
    currentWorkspace: user.currentWorkspace,
  };
};
