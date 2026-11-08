import API from "@/lib/axios-client";
import {
  AllMembersInWorkspaceResponseType,
  ChangeWorkspaceMemberRoleType,
} from "../types/member.types";

export const getMembersInWorkspaceApi = async (
  workspaceId: string
): Promise<AllMembersInWorkspaceResponseType> => {
  const response = await API.get(`/workspace/members/${workspaceId}`);
  return response.data;
};

export const changeWorkspaceMemberRoleApi = async ({
  workspaceId,
  data,
}: ChangeWorkspaceMemberRoleType) => {
  const response = await API.put(
    `/workspace/change/member/role/${workspaceId}`,
    data
  );
  return response.data;
};

export const deleteWorkspaceMemberApi = async ({
  workspaceId,
  memberId,
}: {
  workspaceId: string;
  memberId: string;
}): Promise<{ message: string }> => {
  const response = await API.delete(
    `/workspace/${workspaceId}/members/${memberId}`
  );
  return response.data;
};

