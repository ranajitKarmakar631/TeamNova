import { Request, Response } from "express";
import { asyncHandler } from "../../common/middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import {
  assignMemberSchema,
  associationIdParamSchema,
  getAvailableScopeMembersQuerySchema,
  getScopeMembersQuerySchema,
  getUserAssociationsQuerySchema,
  removeMemberSchema,
  scopeParamsSchema,
  updateAssociationByIdSchema,
  updateMemberRoleSchema,
} from "./association.validation";
import {
  assignMemberToScopeService,
  deleteAssociationPermanentlyService,
  getAssociationByIdService,
  getAvailableScopeMembersService,
  getScopeMembersService,
  getUserAssociationsService,
  removeMemberFromScopeService,
  updateAssociationByIdService,
  updateMemberRoleService,
} from "./association.service";

//********************************
// ASSIGN MEMBER TO SCOPE
//********************************
export const assignMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const body = assignMemberSchema.parse(req.body);

    const { association } = await assignMemberToScopeService(
      currentUserId,
      body
    );

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Member assigned successfully",
      association,
    });
  }
);

//********************************
// UPDATE MEMBER ROLE IN SCOPE
//********************************
export const updateMemberRoleController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const body = updateMemberRoleSchema.parse(req.body);

    const { association } = await updateMemberRoleService(
      currentUserId,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Member role updated successfully",
      association,
    });
  }
);

//********************************
// REMOVE MEMBER FROM SCOPE
//********************************
export const removeMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    // Allow either body or query parameters
    const input = removeMemberSchema.parse(
      req.body && Object.keys(req.body).length > 0 ? req.body : req.query
    );

    const { message, association } = await removeMemberFromScopeService(
      currentUserId,
      input
    );

    return res.status(HTTPSTATUS.OK).json({
      message,
      association,
    });
  }
);

//********************************
// GET SCOPE MEMBERS
//********************************
export const getScopeMembersController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const { scopeType, scopeId } = scopeParamsSchema.parse(req.params);
    const { workspaceId, status, role, search } = getScopeMembersQuerySchema.parse(
      req.query
    );

    const result = await getScopeMembersService(
      currentUserId,
      workspaceId,
      scopeType,
      scopeId,
      status,
      role,
      search
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Scope members retrieved successfully",
      ...result,
    });
  }
);

//********************************
// GET AVAILABLE SCOPE MEMBERS
//********************************
export const getAvailableScopeMembersController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const { scopeType, scopeId } = scopeParamsSchema.parse(req.params);
    const { workspaceId, search } = getAvailableScopeMembersQuerySchema.parse(
      req.query
    );

    const result = await getAvailableScopeMembersService(
      currentUserId,
      workspaceId,
      scopeType,
      scopeId,
      search
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Available members retrieved successfully",
      ...result,
    });
  }
);

//********************************
// GET MY ASSOCIATIONS
//********************************
export const getMyAssociationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const { workspaceId, scopeType, status } =
      getUserAssociationsQuerySchema.parse(req.query);

    const { associations, totalCount } = await getUserAssociationsService(
      currentUserId,
      workspaceId,
      { userId: currentUserId },
      scopeType,
      status
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Your associations retrieved successfully",
      associations,
      totalCount,
    });
  }
);

//********************************
// GET USER ASSOCIATIONS IN WORKSPACE
//********************************
export const getUserAssociationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const targetUserId = req.params.userId;
    const { workspaceId, memberId, scopeType, status } =
      getUserAssociationsQuerySchema.parse(req.query);

    const { associations, totalCount } = await getUserAssociationsService(
      currentUserId,
      workspaceId,
      { userId: targetUserId, memberId },
      scopeType,
      status
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "User associations retrieved successfully",
      associations,
      totalCount,
    });
  }
);

//********************************
// GET ASSOCIATION BY ID
//********************************
export const getAssociationByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const { id } = associationIdParamSchema.parse(req.params);

    const { association } = await getAssociationByIdService(
      currentUserId,
      id
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Association retrieved successfully",
      association,
    });
  }
);

//********************************
// UPDATE ASSOCIATION BY ID
//********************************
export const updateAssociationByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const { id } = associationIdParamSchema.parse(req.params);
    const body = updateAssociationByIdSchema.parse(req.body);

    const { association } = await updateAssociationByIdService(
      currentUserId,
      id,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Association updated successfully",
      association,
    });
  }
);

//********************************             
// DELETE ASSOCIATION PERMANENTLY
//********************************
export const deleteAssociationPermanentlyController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const { id } = associationIdParamSchema.parse(req.params);

    const result = await deleteAssociationPermanentlyService(
      currentUserId,
      id
    );

    return res.status(HTTPSTATUS.OK).json(result);
  }
);
