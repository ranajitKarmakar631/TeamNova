import API from "@/lib/axios-client";
import {
  AllTeamsPayloadType,
  AllTeamsResponseType,
  CreateTeamPayloadType,
  EditTeamPayloadType,
  TeamResponseType,
} from "../types/team.types";

export const getAllTeamsApi = async ({
  workspaceId,
  keyword,
  status,
  projectId,
  pageNumber,
  pageSize,
  onlyMyTeams,
}: AllTeamsPayloadType): Promise<AllTeamsResponseType> => {
  const queryParams = new URLSearchParams();
  if (keyword) queryParams.append("keyword", keyword);
  if (status && status !== "ALL") queryParams.append("status", status);
  if (projectId && projectId !== "ALL") queryParams.append("projectId", projectId);
  if (pageNumber) queryParams.append("pageNumber", String(pageNumber));
  if (pageSize) queryParams.append("pageSize", String(pageSize));
  if (onlyMyTeams !== undefined) queryParams.append("onlyMyTeams", String(onlyMyTeams));

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const response = await API.get(
    `/team/workspace/${workspaceId}/all${queryString}`
  );
  return response.data;
};

export const getTeamByIdApi = async ({
  workspaceId,
  teamId,
}: {
  workspaceId: string;
  teamId: string;
}): Promise<TeamResponseType> => {
  const response = await API.get(`/team/${teamId}/workspace/${workspaceId}`);
  return response.data;
};

export const createTeamApi = async ({
  workspaceId,
  data,
}: CreateTeamPayloadType): Promise<TeamResponseType> => {
  const response = await API.post(`/team/workspace/${workspaceId}/create`, data);
  return response.data;
};

export const editTeamApi = async ({
  workspaceId,
  teamId,
  data,
}: EditTeamPayloadType): Promise<TeamResponseType> => {
  const response = await API.put(
    `/team/${teamId}/workspace/${workspaceId}/update`,
    data
  );
  return response.data;
};

export const deleteTeamApi = async ({
  workspaceId,
  teamId,
}: {
  workspaceId: string;
  teamId: string;
}): Promise<{ message: string }> => {
  const response = await API.delete(
    `/team/${teamId}/workspace/${workspaceId}/delete`
  );
  return response.data;
};

