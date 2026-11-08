import API from "@/lib/axios-client";
import {
  AcceptInviteResponseType,
  AllWorkspaceResponseType,
  AnalyticsResponseType,
  CreateEmailInvitePayloadType,
  CreateInviteResponseType,
  CreateLinkInvitePayloadType,
  CreateWorkspaceResponseType,
  CreateWorkspaceType,
  DeleteWorkspaceResponseType,
  EditWorkspaceType,
  JoinWorkspaceResponseType,
  RevokeInvitationPayloadType,
  WorkspaceByIdResponseType,
} from "../types/workspace.types";

export const createWorkspaceApi = async (
  data: CreateWorkspaceType
): Promise<CreateWorkspaceResponseType> => {
  const response = await API.post("/workspace/create/new", data);
  return response.data;
};

export const editWorkspaceApi = async ({
  workspaceId,
  data,
}: EditWorkspaceType): Promise<{ message: string; workspace: any }> => {
  const response = await API.put(`/workspace/update/${workspaceId}`, data);
  return response.data;
};

export const getAllWorkspacesUserIsMemberApi =
  async (): Promise<AllWorkspaceResponseType> => {
    const response = await API.get("/workspace/all");
    return response.data;
  };

export const getWorkspaceByIdApi = async (
  workspaceId: string
): Promise<WorkspaceByIdResponseType> => {
  const response = await API.get(`/workspace/${workspaceId}`);
  return response.data;
};

export const getWorkspaceAnalyticsApi = async (
  workspaceId: string
): Promise<AnalyticsResponseType> => {
  const response = await API.get(`/workspace/analytics/${workspaceId}`);
  return response.data;
};

export const deleteWorkspaceApi = async (
  workspaceId: string
): Promise<DeleteWorkspaceResponseType> => {
  const response = await API.delete(`/workspace/delete/${workspaceId}`);
  return response.data;
};

export const invitedUserJoinWorkspaceApi = async (
  inviteCode: string
): Promise<JoinWorkspaceResponseType> => {
  const response = await API.post(`/member/workspace/${inviteCode}/join`);
  return response.data;
};

export const createLinkInviteApi = async (
  data: CreateLinkInvitePayloadType
): Promise<CreateInviteResponseType> => {
  const response = await API.post(
    `/invite/workspace/${data.workspaceId}/link`,
    data
  );
  return response.data;
};

export const createEmailInviteApi = async (
  data: CreateEmailInvitePayloadType
): Promise<CreateInviteResponseType> => {
  const response = await API.post(
    `/invite/workspace/${data.workspaceId}/email`,
    data
  );
  return response.data;
};

export const getInviteDetailsApi = async (token: string): Promise<any> => {
  const response = await API.get(`/invite/details/${token}`);
  return response.data;
};

export const getWorkspaceInvitationsApi = async (
  workspaceId: string
): Promise<any> => {
  const response = await API.get(`/invite/workspace/${workspaceId}/all`);
  return response.data;
};

export const revokeInvitationApi = async ({
  workspaceId,
  invitationId,
}: RevokeInvitationPayloadType): Promise<{ message: string }> => {
  const response = await API.delete(
    `/invite/workspace/${workspaceId}/${invitationId}`
  );
  return response.data;
};

export const acceptInviteApi = async (
  token: string
): Promise<AcceptInviteResponseType> => {
  const response = await API.post("/invite/accept", { token });
  return response.data;
};

