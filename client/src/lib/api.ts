import API from "./axios-client";
import {
  AllMembersInWorkspaceResponseType,
  AllProjectPayloadType,
  AllProjectResponseType,
  AllTaskPayloadType,
  AllTaskResponseType,
  AnalyticsResponseType,
  ChangeWorkspaceMemberRoleType,
  CreateProjectPayloadType,
  CreateTaskPayloadType,
  EditTaskPayloadType,
  CreateWorkspaceResponseType,
  EditProjectPayloadType,
  AssignTeamsToProjectPayloadType,
  RemoveTeamFromProjectPayloadType,
  ProjectByIdPayloadType,
  ProjectResponseType,
  ProjectOverviewResponseType,
  ProjectTeamsResponseType,
  ProjectMembersResponseType,
  ProjectMemberTasksResponseType,
} from "../types/api.type";
import {
  AllWorkspaceResponseType,
  CreateWorkspaceType,
  CurrentUserResponseType,
  LoginResponseType,
  loginType,
  registerType,
  WorkspaceByIdResponseType,
  EditWorkspaceType,
  AllTeamsPayloadType,
  AllTeamsResponseType,
  CreateTeamPayloadType,
  EditTeamPayloadType,
  TeamResponseType,
  MyAssociationsResponseType,
  ScopeMembersResponseType,
  AssignMemberPayloadType,
  UpdateMemberRolePayloadType,
  RemoveMemberPayloadType,
  AssociationScopeType,
  AssociationRoleType,
  AvailableMembersResponseType,
} from "@/types/api.type";

export const loginMutationFn = async (
  data: loginType
): Promise<LoginResponseType> => {
  const response = await API.post("/auth/login", data);
  console.log("This is your result" , response);
  return response.data;
};

export const registerMutationFn = async (data: registerType) =>
  await API.post("/auth/register", data);

export const logoutMutationFn = async () => await API.post("/auth/logout");

export const refreshTokenMutationFn = async () =>
  await API.post("/auth/refresh");

export const getCurrentUserQueryFn =
  async (): Promise<CurrentUserResponseType> => {
    const response = await API.get(`/user/current`);
    return response.data;
  };

//********* WORKSPACE ****************
//************* */

export const createWorkspaceMutationFn = async (
  data: CreateWorkspaceType
): Promise<CreateWorkspaceResponseType> => {
  const response = await API.post(`/workspace/create/new`, data);
  return response.data;
};

export const editWorkspaceMutationFn = async ({
  workspaceId,
  data,
}: EditWorkspaceType) => {
  const response = await API.put(`/workspace/update/${workspaceId}`, data);
  return response.data;
};

export const getAllWorkspacesUserIsMemberQueryFn =
  async (): Promise<AllWorkspaceResponseType> => {
    const response = await API.get(`/workspace/all`);
    return response.data;
  };

export const getWorkspaceByIdQueryFn = async (
  workspaceId: string
): Promise<WorkspaceByIdResponseType> => {
  const response = await API.get(`/workspace/${workspaceId}`);
  return response.data;
};

export const getMembersInWorkspaceQueryFn = async (
  workspaceId: string
): Promise<AllMembersInWorkspaceResponseType> => {
  const response = await API.get(`/workspace/members/${workspaceId}`);
  return response.data;
};

export const getWorkspaceAnalyticsQueryFn = async (
  workspaceId: string
): Promise<AnalyticsResponseType> => {
  const response = await API.get(`/workspace/analytics/${workspaceId}`);
  return response.data;
};

export const changeWorkspaceMemberRoleMutationFn = async ({
  workspaceId,
  data,
}: ChangeWorkspaceMemberRoleType) => {
  const response = await API.put(
    `/workspace/change/member/role/${workspaceId}`,
    data
  );
  return response.data;
};

export const deleteWorkspaceMutationFn = async (
  workspaceId: string
): Promise<{
  message: string;
  currentWorkspace: string;
}> => {
  const response = await API.delete(`/workspace/delete/${workspaceId}`);
  return response.data;
};

//*******MEMBER ****************

export const invitedUserJoinWorkspaceMutationFn = async (
  iniviteCode: string
): Promise<{
  message: string;
  workspaceId: string;
}> => {
  const response = await API.post(`/member/workspace/${iniviteCode}/join`);
  return response.data;
};

//********* */
//********* PROJECTS
export const createProjectMutationFn = async ({
  workspaceId,
  data,
}: CreateProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.post(
    `/project/workspace/${workspaceId}/create`,
    data
  );
  return response.data;
};

export const editProjectMutationFn = async ({
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

export const getProjectsInWorkspaceQueryFn = async ({
  workspaceId,
  pageSize = 10,
  pageNumber = 1,
  keyword,
}: AllProjectPayloadType): Promise<AllProjectResponseType> => {
  const queryParams = new URLSearchParams();
  if (keyword) queryParams.append("keyword", keyword);
  if (pageSize) queryParams.append("pageSize", pageSize.toString());
  if (pageNumber) queryParams.append("pageNumber", pageNumber.toString());

  const response = await API.get(
    `/project/workspace/${workspaceId}/all?${queryParams.toString()}`
  );
  return response.data;
};

export const getProjectsByTeamQueryFn = async ({
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
  const queryParams = new URLSearchParams();
  if (pageSize) queryParams.append("pageSize", pageSize.toString());
  if (pageNumber) queryParams.append("pageNumber", pageNumber.toString());

  const response = await API.get(
    `/project/workspace/${workspaceId}/team/${teamId}?${queryParams.toString()}`
  );
  return response.data;
};

export const getProjectByIdQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<ProjectResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}`
  );
  return response.data;
};

export const getProjectAnalyticsQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<AnalyticsResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}/analytics`
  );
  return response.data;
};

export const deleteProjectMutationFn = async ({
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

export const getProjectOverviewQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<ProjectOverviewResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}/overview`
  );
  return response.data;
};

export const getProjectTeamsQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<ProjectTeamsResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}/teams`
  );
  return response.data;
};

export const getProjectMembersQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<ProjectMembersResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}/members`
  );
  return response.data;
};

export const getProjectMemberTasksQueryFn = async ({
  workspaceId,
  projectId,
  userId,
}: {
  workspaceId: string;
  projectId: string;
  userId: string;
}): Promise<ProjectMemberTasksResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}/member/${userId}/tasks`
  );
  return response.data;
};

export const assignTeamsToProjectMutationFn = async ({
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

export const removeTeamFromProjectMutationFn = async ({
  workspaceId,
  projectId,
  teamId,
}: RemoveTeamFromProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.delete(
    `/project/${projectId}/workspace/${workspaceId}/teams/${teamId}`
  );
  return response.data;
};

//*******TASKS ********************************
//************************* */

export const createTaskMutationFn = async ({
  workspaceId,
  projectId,
  data,
}: CreateTaskPayloadType) => {
  const response = await API.post(
    `/task/project/${projectId}/workspace/${workspaceId}/create`,
    data
  );
  return response.data;
};


export const editTaskMutationFn = async ({
  taskId,
  projectId,
  workspaceId,
  data,
}: EditTaskPayloadType): Promise<{message: string;}> => {
  const response = await API.put(
    `/task/${taskId}/project/${projectId}/workspace/${workspaceId}/update/`,
    data
  );
  return response.data;
};

export const getAllTasksQueryFn = async ({
  workspaceId,
  keyword,
  projectId,
  assignedTo,
  priority,
  status,
  dueDate,
  pageNumber,
  pageSize,
}: AllTaskPayloadType): Promise<AllTaskResponseType> => {
  const baseUrl = `/task/workspace/${workspaceId}/all`;

  const queryParams = new URLSearchParams();
  if (keyword) queryParams.append("keyword", keyword);
  if (projectId) queryParams.append("projectId", projectId);
  if (assignedTo) queryParams.append("assignedTo", assignedTo);
  if (priority) queryParams.append("priority", priority);
  if (status) queryParams.append("status", status);
  if (dueDate) queryParams.append("dueDate", dueDate);
  if (pageNumber) queryParams.append("pageNumber", pageNumber?.toString());
  if (pageSize) queryParams.append("pageSize", pageSize?.toString());

  const url = queryParams.toString() ? `${baseUrl}?${queryParams}` : baseUrl;
  const response = await API.get(url);
  return response.data;
};

export const deleteTaskMutationFn = async ({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}): Promise<{
  message: string;
}> => {
  const response = await API.delete(
    `/task/${taskId}/workspace/${workspaceId}/delete`
  );
  return response.data;
};

//*******INVITE ********************************
//************************* */

export const createLinkInviteMutationFn = async (data: {
  workspaceId: string;
  role?: string;
  maxUses?: number | null;
  expiresInDays?: number;
}): Promise<{
  message: string;
  invitation: any;
  token: string;
  inviteUrl: string;
}> => {
  const response = await API.post("/invite/link", data);
  return response.data;
};

export const createEmailInviteMutationFn = async (data: {
  workspaceId: string;
  email: string;
  role?: string;
  expiresInDays?: number;
}): Promise<{
  message: string;
  invitation: any;
  token: string;
  inviteUrl: string;
}> => {
  const response = await API.post("/invite/email", data);
  return response.data;
};

export const getInviteDetailsQueryFn = async (token: string) => {
  const response = await API.get(`/invite/details/${token}`);
  return response.data;
};

export const getWorkspaceInvitationsQueryFn = async (workspaceId: string) => {
  const response = await API.get(`/invite/workspace/${workspaceId}/all`);
  return response.data;
};

export const revokeInvitationMutationFn = async ({
  workspaceId,
  invitationId,
}: {
  workspaceId: string;
  invitationId: string;
}): Promise<{
  message: string;
}> => {
  const response = await API.delete(
    `/invite/workspace/${workspaceId}/${invitationId}`
  );
  return response.data;
};

export const acceptInviteMutationFn = async (token: string): Promise<{
  message: string;
  workspaceId: string;
  role: string;
}> => {
  const response = await API.post("/invite/accept", { token });
  return response.data;
};

// ********** TEAMS API ****************
export const getAllTeamsQueryFn = async ({
  workspaceId,
  keyword,
  status,
  pageNumber,
  pageSize,
}: AllTeamsPayloadType): Promise<AllTeamsResponseType> => {
  const baseUrl = `/team/workspace/${workspaceId}/all`;
  const queryParams = new URLSearchParams();
  if (keyword) queryParams.append("keyword", keyword);
  if (status) queryParams.append("status", status);
  if (pageNumber) queryParams.append("pageNumber", pageNumber.toString());
  if (pageSize) queryParams.append("pageSize", pageSize.toString());

  const url = queryParams.toString() ? `${baseUrl}?${queryParams}` : baseUrl;
  const response = await API.get(url);
  return response.data;
};

export const getTeamByIdQueryFn = async ({
  workspaceId,
  teamId,
}: {
  workspaceId: string;
  teamId: string;
}): Promise<TeamResponseType> => {
  const response = await API.get(`/team/${teamId}/workspace/${workspaceId}`);
  return response.data;
};

export const createTeamMutationFn = async ({
  workspaceId,
  data,
}: CreateTeamPayloadType): Promise<TeamResponseType> => {
  const response = await API.post(`/team/workspace/${workspaceId}/create`, data);
  return response.data;
};

export const editTeamMutationFn = async ({
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

export const deleteTeamMutationFn = async ({
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

// ********** ASSOCIATION ****************
export const getMyAssociationsQueryFn = async (
  workspaceId: string
): Promise<MyAssociationsResponseType> => {
  const response = await API.get(
    `/association/my-associations?workspaceId=${workspaceId}`
  );
  return response.data;
};

export const getScopeMembersQueryFn = async ({
  workspaceId,
  scopeType,
  scopeId,
  status,
  role,
}: {
  workspaceId: string;
  scopeType: AssociationScopeType;
  scopeId: string;
  status?: string;
  role?: AssociationRoleType;
}): Promise<ScopeMembersResponseType> => {
  const params = new URLSearchParams({ workspaceId });
  if (status) params.append("status", status);
  if (role) params.append("role", role);

  const response = await API.get(
    `/association/scope/${scopeType}/${scopeId}?${params.toString()}`
  );
  return response.data;
};

export const assignMemberToScopeMutationFn = async (
  payload: AssignMemberPayloadType
): Promise<{ message: string; association: any }> => {
  const response = await API.post("/association/assign", payload);
  return response.data;
};

export const updateMemberRoleMutationFn = async (
  payload: UpdateMemberRolePayloadType
): Promise<{ message: string; association: any }> => {
  const response = await API.put("/association/role", payload);
  return response.data;
};

export const removeMemberFromScopeMutationFn = async (
  payload: RemoveMemberPayloadType
): Promise<{ message: string }> => {
  const response = await API.post("/association/remove", payload);
  return response.data;
};

export const getAvailableScopeMembersQueryFn = async ({
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
  const params = new URLSearchParams({ workspaceId });
  if (search) params.append("search", search);

  const response = await API.get(
    `/association/scope/${scopeType}/${scopeId}/available-members?${params.toString()}`
  );
  return response.data;
};


