import API from "@/lib/axios-client";
import {
  AssignMemberPayloadType,
  AssociationRoleType,
  AssociationScopeType,
  AvailableMembersResponseType,
  MyAssociationsResponseType,
  RemoveMemberPayloadType,
  ScopeMembersResponseType,
  UpdateMemberRolePayloadType,
} from "../types/association.types";

export const getMyAssociationsApi = async (
  workspaceId: string
): Promise<MyAssociationsResponseType> => {
  const response = await API.get(
    `/association/my-associations?workspaceId=${workspaceId}`
  );
  return response.data;
};

export const getScopeMembersApi = async ({
  workspaceId,
  scopeType,
  scopeId,
  status,
  role,
  search,
}: {
  workspaceId: string;
  scopeType: AssociationScopeType;
  scopeId: string;
  status?: string;
  role?: AssociationRoleType | string;
  search?: string;
}): Promise<ScopeMembersResponseType> => {
  const queryParams = new URLSearchParams();
  queryParams.append("workspaceId", workspaceId);
  queryParams.append("scopeType", scopeType);
  queryParams.append("scopeId", scopeId);
  if (status && status !== "ALL") queryParams.append("status", status);
  if (role && (role as string) !== "ALL") queryParams.append("role", role);
  if (search) queryParams.append("search", search);

  const response = await API.get(`/association/members?${queryParams.toString()}`);
  return response.data;
};

export const assignMemberToScopeApi = async (
  payload: AssignMemberPayloadType
): Promise<{ message: string; association: any }> => {
  const response = await API.post("/association/assign", payload);
  return response.data;
};

export const updateMemberRoleApi = async (
  payload: UpdateMemberRolePayloadType
): Promise<{ message: string; association: any }> => {
  const response = await API.put("/association/role", payload);
  return response.data;
};

export const removeMemberFromScopeApi = async (
  payload: RemoveMemberPayloadType
): Promise<{ message: string }> => {
  const response = await API.post("/association/remove", payload);
  return response.data;
};

export const getAvailableScopeMembersApi = async ({
  workspaceId,
  scopeType,
  scopeId,
  search,
}: {
  workspaceId: string;
  scopeType: AssociationScopeType;
  scopeId: string;
  search?: string;
}): Promise<AvailableMembersResponseType> => {
  const queryParams = new URLSearchParams();
  queryParams.append("workspaceId", workspaceId);
  queryParams.append("scopeType", scopeType);
  queryParams.append("scopeId", scopeId);
  if (search) queryParams.append("search", search);

  const response = await API.get(
    `/association/available-members?${queryParams.toString()}`
  );
  return response.data;
};
