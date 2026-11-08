import mongoose, { Types } from "mongoose";
import AssociationModel, {
  AssociationStatus,
  AssociationStatusType,
  IAssociationDocument,
} from "./association.model";
import {
  AssociationRoles,
  AssociationRoleType,
  AssociationScope,
  AssociationScopeType,
  WorkspaceRoles,
} from "../../common/enums/association.enum";
import WorkspaceModel from "../workspace/workspace.model";
import MemberModel from "../member/member.model";
import TeamModel from "../teams/teams.model";
import ProjectModel from "../project/project.model";
import TaskModel from "../task/task.model";
import { getMemberRoleInWorkspace } from "../member/member.service";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../../common/utils/appError";
import {
  AssignMemberInput,
  RemoveMemberInput,
  UpdateAssociationByIdInput,
  UpdateMemberRoleInput,
} from "./association.validation";

//********************************
// RESOLVE MEMBER HELPER
//********************************
export const    resolveMember = async (
  workspaceId: string,
  memberId?: string,
  userId?: string
) => {
  if (memberId) {
    let member = null;
    if (mongoose.isValidObjectId(memberId)) {
      member = await MemberModel.findOne({
        _id: memberId,
        workspaceId,
      });
      // Fallback: check if memberId was actually passed as a userId
      if (!member) {
        member = await MemberModel.findOne({
          userId: memberId,
          workspaceId,
        });
      }
    }
    if (!member) {
      throw new NotFoundException("Member not found in this workspace");
    }
    return member;
  }

  if (userId) {
    let member = null;
    if (mongoose.isValidObjectId(userId)) {
      member = await MemberModel.findOne({
        userId,
        workspaceId,
      });
      // Fallback: check if userId was actually passed as a memberId
      if (!member) {
        member = await MemberModel.findOne({
          _id: userId,
          workspaceId,
        });
      }
    }
    if (!member) {
      throw new NotFoundException("The specified user is not a member of this workspace");
    }
    return member;
  }

  throw new BadRequestException("Either memberId or userId must be provided");
};

//********************************
// PERMISSION VERIFICATION HELPER
//********************************
export const verifyScopePermission = async (
  currentUserId: string,
  workspaceId: string,
  scopeType: AssociationScopeType,
  scopeId: string,
  action: "READ" | "MANAGE"
) => {
  const { role } = await getMemberRoleInWorkspace(currentUserId, workspaceId);

  // Read permission is granted to any valid workspace member
  if (action === "READ") {
    return { workspaceRole: role };
  }

  // Workspace OWNER and ADMIN always have full management authority
  if (role === WorkspaceRoles.OWNER || role === WorkspaceRoles.ADMIN) {
    return { workspaceRole: role };
  }

  // Workspace MANAGER has management rights for Teams
  if (role === WorkspaceRoles.MANAGER && scopeType === AssociationScope.TEAM) {
    return { workspaceRole: role };
  }

  // Check if current user is the creator of the Project or Team
  if (scopeType === AssociationScope.PROJECT) {
    const project = await ProjectModel.findOne({ _id: scopeId, workspace: workspaceId });
    if (project && project.createdBy.toString() === currentUserId.toString()) {
      return { workspaceRole: role, associationRole: AssociationRoles.HEAD };
    }
  } else if (scopeType === AssociationScope.TEAM) {
    const team = await TeamModel.findOne({ _id: scopeId, workspaceId });
    if (team && team.createdBy.toString() === currentUserId.toString()) {
      return { workspaceRole: role, associationRole: AssociationRoles.HEAD };
    }
  }

  // Check if current user is HEAD or LEAD of this specific scope (Team or Project)
  const currentMember = await MemberModel.findOne({
    userId: currentUserId,
    workspaceId,
  });

  if (currentMember) {
    const userAssociation = await AssociationModel.findOne({
      memberId: currentMember._id,
      workspaceId,
      scopeType,
      scopeId,
      status: AssociationStatus.ACTIVE,
    });

    if (
      userAssociation &&
      (userAssociation.role === AssociationRoles.HEAD ||
        userAssociation.role === AssociationRoles.LEAD)
    ) {
      return { workspaceRole: role, associationRole: userAssociation.role };
    }

    // If scope is PROJECT, also check if user is HEAD or LEAD of any owning/assigned Team
    if (scopeType === AssociationScope.PROJECT) {
      const project = await ProjectModel.findOne({
        _id: scopeId,
        workspace: workspaceId,
      });

      if (project) {
        const teamIdsToCheck: any[] = [];
        if (project.team) teamIdsToCheck.push(project.team);
        if (project.teams && Array.isArray(project.teams)) {
          project.teams.forEach((t) => teamIdsToCheck.push(t));
        }

        if (teamIdsToCheck.length > 0) {
          const teamAssoc = await AssociationModel.findOne({
            memberId: currentMember._id,
            workspaceId,
            scopeType: AssociationScope.TEAM,
            scopeId: { $in: teamIdsToCheck },
            status: AssociationStatus.ACTIVE,
            role: { $in: [AssociationRoles.HEAD, AssociationRoles.LEAD] },
          });

          if (teamAssoc) {
            return { workspaceRole: role, associationRole: teamAssoc.role };
          }
        }
      }
    }
  }


  throw new UnauthorizedException(
    `You do not have permission to manage members for this ${scopeType.toLowerCase()}`
  );
};

export const validateScopeExists = async (
  workspaceId: string,
  scopeType: AssociationScopeType,
  scopeId: string
) => {
  if (scopeType === AssociationScope.TEAM) {
    const team = await TeamModel.findOne({ _id: scopeId, workspaceId });
    if (!team) {
      throw new NotFoundException("Team not found in this workspace");
    }
    return team;
  }

  if (scopeType === AssociationScope.PROJECT) {
    const project = await ProjectModel.findOne({
      _id: scopeId,
      workspace: workspaceId,
    });
    if (!project) {
      throw new NotFoundException("Project not found in this workspace");
    }
    return project;
  }

  throw new BadRequestException("Invalid scope type specified");
};

//********************************
// POPULATION HELPER
//********************************
const populateAssociation = (query: any) => {
  return query.populate({
    path: "memberId",
    populate: [
      { path: "userId", select: "name email profilePicture" },
      { path: "role", select: "name" },
    ],
  });
};

//********************************
// ASSIGN MEMBER TO SCOPE
//********************************
export const assignMemberToScopeService = async (
  currentUserId: string,
  data: AssignMemberInput
) => {
  const { workspaceId, scopeType, scopeId, role } = data;

  // 1. Validate that the scope exists in the workspace
  const scopeDoc: any = await validateScopeExists(workspaceId, scopeType, scopeId);

  // 2. Resolve and verify that the target member exists in this workspace
  const member = await resolveMember(workspaceId, data.memberId, data.userId);

  const isSelf = member.userId.toString() === currentUserId.toString();
  const isCreator = scopeDoc?.createdBy?.toString() === currentUserId.toString();

  // 3. Check management permission:
  // If assigning someone else, MANAGE permission is required.
  // If self-joining, any workspace member can join.
  if (!isSelf) {
    await verifyScopePermission(currentUserId, workspaceId, scopeType, scopeId, "MANAGE");
  }

  // 3b. For PROJECT scopes, check if the member is already part of any team under this project
  if (scopeType === AssociationScope.PROJECT) {
    const project = await ProjectModel.findOne({
      _id: scopeId,
      workspace: workspaceId,
    });

    if (project) {
      const assignedTeamIds: mongoose.Types.ObjectId[] = [];
      if (project.team) {
        assignedTeamIds.push(new mongoose.Types.ObjectId(project.team.toString()));
      }
      if (project.teams && Array.isArray(project.teams)) {
        project.teams.forEach((t) => {
          const id = (t as any)?._id || t;
          if (id) assignedTeamIds.push(new mongoose.Types.ObjectId(id.toString()));
        });
      }

      // Also find teams created under this project
      const teamsUnderProject = await TeamModel.find({
        workspaceId,
        projectId: project._id,
      }).select("_id");
      teamsUnderProject.forEach((t) => {
        if (!assignedTeamIds.some((id) => id.equals(t._id))) {
          assignedTeamIds.push(t._id);
        }
      });

      if (assignedTeamIds.length > 0) {
        const teamAssoc = await AssociationModel.findOne({
          memberId: member._id,
          workspaceId,
          scopeType: AssociationScope.TEAM,
          scopeId: { $in: assignedTeamIds },
          status: AssociationStatus.ACTIVE,
        });

        if (teamAssoc) {
          throw new BadRequestException(
            "This member is already part of this project through an assigned team. Duplicate memberships are not allowed."
          );
        }
      }
    }
  } else if (scopeType === AssociationScope.TEAM) {
    // 3c. For TEAM scopes: prevent member duplication in the project
    const teamDoc = await TeamModel.findOne({ _id: scopeId, workspaceId });
    if (teamDoc && teamDoc.projectId) {
      // Check if already assigned to project independently
      const directAssoc = await AssociationModel.findOne({
        memberId: member._id,
        workspaceId,
        scopeType: AssociationScope.PROJECT,
        scopeId: teamDoc.projectId,
        status: AssociationStatus.ACTIVE,
      });

      if (directAssoc) {
        throw new BadRequestException(
          "This member is already assigned to this project independently. Duplicate memberships are not allowed."
        );
      }

      // Check if already in another team under the same project
      const otherTeams = await TeamModel.find({
        workspaceId,
        projectId: teamDoc.projectId,
        _id: { $ne: teamDoc._id },
      }).select("_id");
      const otherTeamIds = otherTeams.map((t) => t._id);

      if (otherTeamIds.length > 0) {
        const otherTeamAssoc = await AssociationModel.findOne({
          memberId: member._id,
          workspaceId,
          scopeType: AssociationScope.TEAM,
          scopeId: { $in: otherTeamIds },
          status: AssociationStatus.ACTIVE,
        });

        if (otherTeamAssoc) {
          throw new BadRequestException(
            "This member is already part of another team in this project. Duplicate memberships are not allowed."
          );
        }
      }
    }
  }

  // 4. Check if association already exists
  let association = await AssociationModel.findOne({
    memberId: member._id,
    workspaceId,
    scopeType,
    scopeId,
  });

  const defaultRole = isCreator ? AssociationRoles.HEAD : AssociationRoles.MEMBER;
  const assignedRole = role || defaultRole;

  if (association) {
    if (association.status === AssociationStatus.ACTIVE) {
      throw new BadRequestException(
        `Member is already assigned to this ${scopeType.toLowerCase()}`
      );
    }

    // Reactivate previously removed association
    association.status = AssociationStatus.ACTIVE;
    association.role = assignedRole;
    association.joinedAt = new Date();
    await association.save();
  } else {
    // Create fresh association
    association = await AssociationModel.create({
      memberId: member._id,
      workspaceId,
      scopeType,
      scopeId,
      role: assignedRole,
      status: AssociationStatus.ACTIVE,
      joinedAt: new Date(),
    });
  }

  // NOTE: Members joined under a team belong to the project through their team,
  // and do NOT have an independent project association (preventing duplication).

  await populateAssociation(association);

  return { association };
};

//********************************
// UPDATE MEMBER ROLE IN SCOPE
//********************************
export const updateMemberRoleService = async (
  currentUserId: string,
  data: UpdateMemberRoleInput
) => {
  const { workspaceId, scopeType, scopeId, role } = data;

  await verifyScopePermission(currentUserId, workspaceId, scopeType, scopeId, "MANAGE");
  await validateScopeExists(workspaceId, scopeType, scopeId);

  const member = await resolveMember(workspaceId, data.memberId, data.userId);

  const association = await AssociationModel.findOne({
    memberId: member._id,
    workspaceId,
    scopeType,
    scopeId,
    status: AssociationStatus.ACTIVE,
  });

  if (!association) {
    throw new NotFoundException(
      `Active member association not found in this ${scopeType.toLowerCase()}`
    );
  }

  association.role = role;
  await association.save();
  await populateAssociation(association);

  return { association };
};

//********************************
// REMOVE MEMBER FROM SCOPE (SOFT DELETE)
//********************************
export const removeMemberFromScopeService = async (
  currentUserId: string,
  data: RemoveMemberInput
) => {
  const { workspaceId, scopeType, scopeId } = data;

  await validateScopeExists(workspaceId, scopeType, scopeId);

  const member = await resolveMember(workspaceId, data.memberId, data.userId);

  const isSelf = member.userId.toString() === currentUserId.toString();
  if (!isSelf) {
    await verifyScopePermission(currentUserId, workspaceId, scopeType, scopeId, "MANAGE");
  }

  let association = await AssociationModel.findOne({
    memberId: member._id,
    workspaceId,
    scopeType,
    scopeId,
    status: AssociationStatus.ACTIVE,
  });

  if (!association) {
    // If no active association exists, upsert a REMOVED association so the removal is explicitly recorded
    association = await AssociationModel.findOneAndUpdate(
      {
        memberId: member._id,
        workspaceId,
        scopeType,
        scopeId,
      },
      {
        $set: {
          status: AssociationStatus.REMOVED,
        },
      },
      { upsert: true, new: true }
    );
  } else {
    association.status = AssociationStatus.REMOVED;
    await association.save();
  }

  // If removed from a Project:
  // Requirement 6: "if someone is removed from the project, he should be removed from the team in which he is joined."
  if (scopeType === AssociationScope.PROJECT) {
    // 1. Find all teams under this project
    const projectDoc = await ProjectModel.findOne({ _id: scopeId, workspace: workspaceId });
    const teamsUnderProject = await TeamModel.find({
      workspaceId,
      projectId: scopeId,
    }).select("_id");

    const allProjectTeamIds: mongoose.Types.ObjectId[] = teamsUnderProject.map((t) => t._id);
    if (projectDoc) {
      if (projectDoc.team && !allProjectTeamIds.some((id) => id.equals(projectDoc.team!))) {
        allProjectTeamIds.push(new mongoose.Types.ObjectId(projectDoc.team.toString()));
      }
      if (projectDoc.teams && Array.isArray(projectDoc.teams)) {
        projectDoc.teams.forEach((t: any) => {
          const tid = (t?._id || t) as mongoose.Types.ObjectId;
          if (tid && !allProjectTeamIds.some((id) => id.equals(tid))) {
            allProjectTeamIds.push(new mongoose.Types.ObjectId(tid.toString()));
          }
        });
      }
    }

    // 2. Cascade remove member from any team under this project
    if (allProjectTeamIds.length > 0) {
      await AssociationModel.updateMany(
        {
          workspaceId,
          memberId: member._id,
          scopeType: AssociationScope.TEAM,
          scopeId: { $in: allProjectTeamIds },
          status: AssociationStatus.ACTIVE,
        },
        {
          $set: { status: AssociationStatus.REMOVED },
        }
      );
    }

    // 3. Unassign tasks in this project assigned to this user
    await TaskModel.updateMany(
      {
        workspace: workspaceId,
        project: scopeId,
        assignedTo: member.userId,
      },
      {
        $pull: { assignedTo: member.userId },
      }
    );
  }

  // If removed from a Team, check if member is part of any other active team in projects assigned to this team
  if (scopeType === AssociationScope.TEAM) {
    const teamProjects = await ProjectModel.find({
      workspace: workspaceId,
      $or: [{ team: scopeId }, { teams: scopeId }],
    });

    for (const proj of teamProjects) {
      // Do not remove the project creator from the project
      if (proj.createdBy && proj.createdBy.toString() === member.userId.toString()) {
        continue;
      }

      const otherAssignedTeamIds: mongoose.Types.ObjectId[] = [];
      if (proj.team && proj.team.toString() !== scopeId.toString()) {
        otherAssignedTeamIds.push(new mongoose.Types.ObjectId(proj.team.toString()));
      }
      if (proj.teams && Array.isArray(proj.teams)) {
        proj.teams.forEach((t: any) => {
          const id = (t?._id || t).toString();
          if (id && id !== scopeId.toString()) {
            otherAssignedTeamIds.push(new mongoose.Types.ObjectId(id));
          }
        });
      }

      let hasOtherTeam = false;
      if (otherAssignedTeamIds.length > 0) {
        const count = await AssociationModel.countDocuments({
          memberId: member._id,
          workspaceId,
          scopeType: AssociationScope.TEAM,
          scopeId: { $in: otherAssignedTeamIds },
          status: AssociationStatus.ACTIVE,
        });
        if (count > 0) hasOtherTeam = true;
      }

      if (!hasOtherTeam) {
        // Only remove if they are a regular MEMBER (do not remove if HEAD or LEAD)
        const projAssoc = await AssociationModel.findOne({
          memberId: member._id,
          workspaceId,
          scopeType: AssociationScope.PROJECT,
          scopeId: proj._id,
          status: AssociationStatus.ACTIVE,
        });

        if (projAssoc && projAssoc.role === AssociationRoles.MEMBER) {
          await AssociationModel.updateOne(
            { _id: projAssoc._id },
            { $set: { status: AssociationStatus.REMOVED } }
          );

          await TaskModel.updateMany(
            {
              workspace: workspaceId,
              project: proj._id,
              assignedTo: member.userId,
            },
            {
              $set: { assignedTo: null },
            }
          );
        }
      }
    }
  }

  return {
    message: isSelf
      ? `Left ${scopeType.toLowerCase()} successfully`
      : `Member removed from ${scopeType.toLowerCase()}`,
    association,
  };
};

//********************************
// GET SCOPE MEMBERS
//********************************
export const getScopeMembersService = async (
  currentUserId: string,
  workspaceId: string,
  scopeType: AssociationScopeType,
  scopeId: string,
  status: AssociationStatusType = AssociationStatus.ACTIVE,
  role?: AssociationRoleType,
  search?: string
) => {
  await verifyScopePermission(currentUserId, workspaceId, scopeType, scopeId, "READ");
  const scopeDoc: any = await validateScopeExists(workspaceId, scopeType, scopeId);

  const filter: any = {
    workspaceId,
    scopeType,
    scopeId,
    status,
  };

  if (role) {
    filter.role = role;
  }

  const query = AssociationModel.find(filter).sort({ role: 1, createdAt: 1 });
  const allMembers = await populateAssociation(query).exec();

  const roleStats = {
    [AssociationRoles.HEAD]: 0,
    [AssociationRoles.LEAD]: 0,
    [AssociationRoles.MEMBER]: 0,
  };

  allMembers.forEach((member: any) => {
    if (roleStats[member.role as AssociationRoleType] !== undefined) {
      roleStats[member.role as AssociationRoleType]++;
    }
  });

  let members = allMembers;
  if (search && search.trim() !== "") {
    const s = search.trim().toLowerCase();
    members = allMembers.filter((m: any) => {
      const u = m.memberId?.userId;
      const name = (u?.name || "").toLowerCase();
      const email = (u?.email || "").toLowerCase();
      return name.includes(s) || email.includes(s);
    });
  }

  return {
    members,
    totalCount: members.length,
    scopeType,
    scopeId,
    roleStats,
    createdBy: scopeDoc?.createdBy?.toString(),
  };
};

//********************************
// GET AVAILABLE SCOPE MEMBERS
// (Members eligible to join / be added to Project or Team)
//********************************
export const getAvailableScopeMembersService = async (
  currentUserId: string,
  workspaceId: string,
  scopeType: AssociationScopeType,
  scopeId: string,
  search?: string
) => {
  await verifyScopePermission(
    currentUserId,
    workspaceId,
    scopeType,
    scopeId,
    "READ"
  );
  await validateScopeExists(workspaceId, scopeType, scopeId);

  const excludedMemberIdSet = new Set<string>();
  let isCurrentUserJoined = false;
  let joinedVia: "TEAM" | "DIRECT" | null = null;

  if (scopeType === AssociationScope.PROJECT) {
    const project = await ProjectModel.findOne({
      _id: scopeId,
      workspace: workspaceId,
    });

    if (!project) {
      throw new NotFoundException("Project not found in this workspace");
    }

    // 1. Identify all teams assigned under this project
    const assignedTeamIds: mongoose.Types.ObjectId[] = [];
    if (project.team) {
      assignedTeamIds.push(new mongoose.Types.ObjectId(project.team.toString()));
    }
    if (project.teams && Array.isArray(project.teams)) {
      project.teams.forEach((t) => {
        const id = (t as any)?._id || t;
        if (id) assignedTeamIds.push(new mongoose.Types.ObjectId(id.toString()));
      });
    }

    // 2. Remove all members who are joined in the teams under this project
    if (assignedTeamIds.length > 0) {
      const teamAssociations = await AssociationModel.find({
        workspaceId,
        scopeType: AssociationScope.TEAM,
        scopeId: { $in: assignedTeamIds },
        status: AssociationStatus.ACTIVE,
      }).select("memberId");

      teamAssociations.forEach((ta) => {
        if (ta.memberId) {
          excludedMemberIdSet.add(ta.memberId.toString());
        }
      });
    }

    // 3. Remove all members who are directly joined to the project without any teams
    const directProjectAssocs = await AssociationModel.find({
      workspaceId,
      scopeType: AssociationScope.PROJECT,
      scopeId: project._id,
      status: AssociationStatus.ACTIVE,
    }).select("memberId");

    directProjectAssocs.forEach((pa) => {
      if (pa.memberId) {
        excludedMemberIdSet.add(pa.memberId.toString());
      }
    });
  } else if (scopeType === AssociationScope.TEAM) {
    // For TEAMS: filter out members who are already joined in the team
    const team = await TeamModel.findOne({
      _id: scopeId,
      workspaceId,
    });

    if (!team) {
      throw new NotFoundException("Team not found in this workspace");
    }

    const teamAssocs = await AssociationModel.find({
      workspaceId,
      scopeType: AssociationScope.TEAM,
      scopeId: team._id,
      status: AssociationStatus.ACTIVE,
    }).select("memberId");

    teamAssocs.forEach((ta) => {
      if (ta.memberId) {
        excludedMemberIdSet.add(ta.memberId.toString());
      }
    });

    // Requirement 2: No duplication of member in a project (independently or under another team)
    const resolvedProjectId = team.projectId;
    if (resolvedProjectId) {
      // Exclude members joined directly to the project
      const directProjectAssocs = await AssociationModel.find({
        workspaceId,
        scopeType: AssociationScope.PROJECT,
        scopeId: resolvedProjectId,
        status: AssociationStatus.ACTIVE,
      }).select("memberId");

      directProjectAssocs.forEach((pa) => {
        if (pa.memberId) excludedMemberIdSet.add(pa.memberId.toString());
      });

      // Exclude members joined in other teams under the same project
      const otherTeams = await TeamModel.find({
        workspaceId,
        projectId: resolvedProjectId,
        _id: { $ne: team._id },
      }).select("_id");
      const otherTeamIds = otherTeams.map((t) => t._id);

      if (otherTeamIds.length > 0) {
        const otherTeamAssocs = await AssociationModel.find({
          workspaceId,
          scopeType: AssociationScope.TEAM,
          scopeId: { $in: otherTeamIds },
          status: AssociationStatus.ACTIVE,
        }).select("memberId");

        otherTeamAssocs.forEach((ota) => {
          if (ota.memberId) excludedMemberIdSet.add(ota.memberId.toString());
        });
      }
    }
  }

  // Convert excluded member IDs to ObjectIds
  const excludedMemberObjIds = Array.from(excludedMemberIdSet).map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  // Find corresponding user IDs for excluded members
  const excludedMemberDocs = await MemberModel.find({
    _id: { $in: excludedMemberObjIds },
  }).select("userId");

  const excludedUserIdSet = new Set<string>();
  excludedMemberDocs.forEach((m) => {
    if (m.userId) {
      excludedUserIdSet.add(m.userId.toString());
    }
  });

  // Check if current user is already joined
  if (excludedUserIdSet.has(currentUserId.toString())) {
    isCurrentUserJoined = true;
    if (scopeType === AssociationScope.PROJECT) {
      const currentMember = await MemberModel.findOne({
        userId: currentUserId,
        workspaceId,
      });
      if (currentMember) {
        const direct = await AssociationModel.findOne({
          memberId: currentMember._id,
          workspaceId,
          scopeType: AssociationScope.PROJECT,
          scopeId,
          status: AssociationStatus.ACTIVE,
        });
        joinedVia = direct ? "DIRECT" : "TEAM";
      }
    } else {
      joinedVia = "DIRECT";
    }
  }

  // Fetch all available members from MemberModel (excluding all active participants)
  const memberFilter: any = {
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    _id: { $nin: excludedMemberObjIds },
    userId: {
      $nin: Array.from(excludedUserIdSet).map(
        (id) => new mongoose.Types.ObjectId(id)
      ),
    },
  };

  const availableMembers = await MemberModel.find(memberFilter)
    .populate({
      path: "userId",
      select: "name email profilePicture",
    })
    .populate({
      path: "role",
      select: "name",
    })
    .lean();

  let filtered = availableMembers.filter(
    (m: any) => m.userId && (m.userId as any)._id
  );

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((m: any) => {
      const name = m.userId?.name?.toLowerCase() || "";
      const email = m.userId?.email?.toLowerCase() || "";
      return name.includes(s) || email.includes(s);
    });
  }

  return {
    members: filtered,
    totalCount: filtered.length,
    isCurrentUserJoined,
    joinedVia,
  };
};

//********************************
// GET MEMBER'S ASSOCIATIONS IN WORKSPACE
//********************************
export const getUserAssociationsService = async (
  currentUserId: string,
  workspaceId: string,
  identifier: { memberId?: string; userId?: string },
  scopeType?: AssociationScopeType,
  status: AssociationStatusType = AssociationStatus.ACTIVE
) => {
  await getMemberRoleInWorkspace(currentUserId, workspaceId);

  const member = await resolveMember(
    workspaceId,
    identifier.memberId,
    identifier.userId || currentUserId
  );

  const filter: any = {
    memberId: member._id,
    workspaceId,
    status,
  };

  if (scopeType) {
    filter.scopeType = scopeType;
  }

  const associations = await AssociationModel.find(filter).lean().exec();

  // Populate scope details dynamically
  const populatedAssociations = await Promise.all(
    associations.map(async (assoc) => {
      let scopeDetails: any = null;

      if (assoc.scopeType === AssociationScope.TEAM) {
        scopeDetails = await TeamModel.findById(assoc.scopeId)
          .select("name slug description status")
          .lean();
      } else if (assoc.scopeType === AssociationScope.PROJECT) {
        scopeDetails = await ProjectModel.findById(assoc.scopeId)
          .select("name emoji description")
          .lean();
      }

      return {
        ...assoc,
        scopeDetails,
      };
    })
  );

  return {
    associations: populatedAssociations,
    totalCount: populatedAssociations.length,
  };
};

//********************************
// GET ASSOCIATION BY ID
//********************************
export const getAssociationByIdService = async (
  currentUserId: string,
  associationId: string
) => {
  const query = AssociationModel.findById(associationId).populate(
    "workspaceId",
    "name"
  );
  const association = (await populateAssociation(query)) as any;

  if (!association) {
    throw new NotFoundException("Association not found");
  }

  await getMemberRoleInWorkspace(
    currentUserId,
    association.workspaceId._id.toString()
  );

  return { association };
};

//********************************
// UPDATE ASSOCIATION BY ID
//********************************
export const updateAssociationByIdService = async (
  currentUserId: string,
  associationId: string,
  data: UpdateAssociationByIdInput
) => {
  const association = await AssociationModel.findById(associationId);
  if (!association) {
    throw new NotFoundException("Association not found");
  }

  await verifyScopePermission(
    currentUserId,
    association.workspaceId.toString(),
    association.scopeType,
    association.scopeId.toString(),
    "MANAGE"
  );

  if (data.role) {
    association.role = data.role;
  }
  if (data.status) {
    association.status = data.status;
  }

  await association.save();
  await populateAssociation(association);

  return { association };
};

//********************************
// DELETE ASSOCIATION PERMANENTLY
//********************************
export const deleteAssociationPermanentlyService = async (
  currentUserId: string,
  associationId: string
) => {
  const association = await AssociationModel.findById(associationId);
  if (!association) {
    throw new NotFoundException("Association not found");
  }

  await verifyScopePermission(
    currentUserId,
    association.workspaceId.toString(),
    association.scopeType,
    association.scopeId.toString(),
    "MANAGE"
  );

  await association.deleteOne();

  return {
    message: "Association deleted permanently",
  };
};

//********************************
// HELPER: GET USER / MEMBER ROLE IN SCOPE
//********************************
export const getUserRoleInScope = async (
  identifier: { memberId?: string; userId?: string },
  workspaceId: string,
  scopeType: AssociationScopeType,
  scopeId: string
): Promise<AssociationRoleType | null> => {
  let memberId = identifier.memberId;
  if (!memberId && identifier.userId) {
    const member = await MemberModel.findOne({
      userId: identifier.userId,
      workspaceId,
    });
    if (!member) return null;
    memberId = (member._id as any).toString();
  }

  if (!memberId) return null;

  const association = await AssociationModel.findOne({
    memberId,
    workspaceId,
    scopeType,
    scopeId,
    status: AssociationStatus.ACTIVE,
  });

  return association ? association.role : null;
};
    