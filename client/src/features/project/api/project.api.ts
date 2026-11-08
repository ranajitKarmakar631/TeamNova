import API from "@/lib/axios-client";
import {
  AllProjectPayloadType,
  AllProjectResponseType,
  AssignTeamsToProjectPayloadType,
  CreateProjectPayloadType,
  EditProjectPayloadType,
  GetProjectMembersPayloadType,
  GetProjectTeamsPayloadType,
  ProjectByIdPayloadType,
  ProjectMemberTasksResponseType,
  ProjectMembersResponseType,
  ProjectOverviewResponseType,
  ProjectResponseType,
  ProjectTeamsResponseType,
  RemoveTeamFromProjectPayloadType,
} from "../types/project.types";
import { AnalyticsResponseType } from "@/features/workspace/types/workspace.types";

export const createProjectApi = async ({
  workspaceId,
  data,
}: CreateProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.post(
    `/project/workspace/${workspaceId}/create`,
    data
  );
  return response.data;
};

export const editProjectApi = async ({
  projectId,
  workspaceId,
  data,
}: EditProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.put(
    `/project/${projectId}/workspace/${workspaceId}/update`,
    data
  );
  return response.data;
};

export const getProjectsInWorkspaceApi = async ({
  workspaceId,
  pageSize = 10,
  pageNumber = 1,
  keyword,
  onlyMyProjects,
}: AllProjectPayloadType): Promise<AllProjectResponseType> => {
  const queryParams = new URLSearchParams();
  if (keyword) queryParams.append("keyword", keyword);
  if (onlyMyProjects !== undefined)
    queryParams.append("onlyMyProjects", String(onlyMyProjects));
  const queryString = queryParams.toString() ? `&${queryParams.toString()}` : "";

  const response = await API.get(
    `/project/workspace/${workspaceId}/all?pageSize=${pageSize}&pageNumber=${pageNumber}${queryString}`
  );
  return response.data;
};

export const getProjectsByTeamApi = async ({
  workspaceId,
  teamId,
  pageSize = 10,
  pageNumber = 1,
}: {
  workspaceId: string;
  teamId: string;
  pageSize?: number;
  pageNumber?: number;
}): Promise<AllProjectResponseType> => {
  const response = await API.get(
    `/project/workspace/${workspaceId}/team/${teamId}?pageSize=${pageSize}&pageNumber=${pageNumber}`
  );
  return response.data;
};

export const getProjectByIdApi = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<ProjectResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}`
  );
  return response.data;
};

export const getProjectAnalyticsApi = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<AnalyticsResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}/analytics`
  );
  return response.data;
};

export const deleteProjectApi = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<{
  message: string;
}> => {
  const response = await API.delete(
    `/project/${projectId}/workspace/${workspaceId}/delete`
  );
  return response.data;
};

export const getProjectOverviewApi = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<ProjectOverviewResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}/overview`
  );
  return response.data;
};

export const getProjectTeamsApi = async ({
  workspaceId,
  projectId,
  search,
  status,
}: GetProjectTeamsPayloadType): Promise<ProjectTeamsResponseType> => {
  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  if (status && status !== "ALL") queryParams.append("status", status);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}/teams${queryString}`
  );
  return response.data;
};

export const getProjectMembersApi = async ({
  workspaceId,
  projectId,
  search,
  teamId,
  role,
  sortBy,
}: GetProjectMembersPayloadType): Promise<ProjectMembersResponseType> => {
  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  if (teamId && teamId !== "ALL") queryParams.append("teamId", teamId);
  if (role && role !== "ALL") queryParams.append("role", role);
  if (sortBy) queryParams.append("sortBy", sortBy);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}/members${queryString}`
  );
  return response.data;
};

export const getProjectMemberTasksApi = async ({
  workspaceId,
  projectId,
  userId,
}: {
  workspaceId: string;
  projectId: string;
  userId: string;
}): Promise<ProjectMemberTasksResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}/members/${userId}/tasks`
  );
  return response.data;
};

export const assignTeamsToProjectApi = async ({
  workspaceId,
  projectId,
  teamIds,
}: AssignTeamsToProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.post(
    `/project/${projectId}/workspace/${workspaceId}/teams`,
    { teamIds }
  );
  return response.data;
};

export const removeTeamFromProjectApi = async ({
  workspaceId,
  projectId,
  teamId,
}: RemoveTeamFromProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.delete(
    `/project/${projectId}/workspace/${workspaceId}/teams/${teamId}`
  );
  return response.data;
};

