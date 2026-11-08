import API from "./axios-client";
import {
  NotificationItemType,
  NotificationsResponseType,
  UnreadCountResponseType,
} from "@/types/notification.type";
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
  GetProjectMembersPayloadType,
  GetProjectTeamsPayloadType,
  CommentType,
  CommentsResponseType,
  CommentRepliesResponseType,
  CreateCommentPayloadType,
  UpdateCommentPayloadType,
  DeleteCommentPayloadType,
  ToggleCommentReactionPayloadType,
  GetCommentsPayloadType,
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

export const deleteWorkspaceMemberMutationFn = async ({
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
  onlyMyProjects,
}: AllProjectPayloadType): Promise<AllProjectResponseType> => {
  const queryParams = new URLSearchParams();
  if (keyword) queryParams.append("keyword", keyword);
  if (pageSize) queryParams.append("pageSize", pageSize.toString());
  if (pageNumber) queryParams.append("pageNumber", pageNumber.toString());
  if (onlyMyProjects) queryParams.append("onlyMyProjects", "true");

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

export const getProjectMembersQueryFn = async ({
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
  teamId,
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
  if (teamId) queryParams.append("teamId", teamId);
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
  projectId,
  pageNumber,
  pageSize,
  onlyMyTeams,
}: AllTeamsPayloadType): Promise<AllTeamsResponseType> => {
  const baseUrl = `/team/workspace/${workspaceId}/all`;
  const queryParams = new URLSearchParams();
  if (keyword) queryParams.append("keyword", keyword);
  if (status) queryParams.append("status", status);
  if (projectId) queryParams.append("projectId", projectId);
  if (pageNumber) queryParams.append("pageNumber", pageNumber.toString());
  if (pageSize) queryParams.append("pageSize", pageSize.toString());
  if (onlyMyTeams) queryParams.append("onlyMyTeams", "true");

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
  search,
}: {
  workspaceId: string;
  scopeType: AssociationScopeType;
  scopeId: string;
  status?: string;
  role?: AssociationRoleType;
  search?: string;
}): Promise<ScopeMembersResponseType> => {
  const params = new URLSearchParams({ workspaceId });
  if (status) params.append("status", status);
  if (role) params.append("role", role);
  if (search) params.append("search", search);

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

// ==========================================
// NOTIFICATIONS API
// ==========================================

export const getNotificationsQueryFn = async (params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
  workspaceId?: string;
}): Promise<NotificationsResponseType> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.limit) queryParams.append("limit", String(params.limit));
  if (params?.isRead !== undefined)
    queryParams.append("isRead", String(params.isRead));
  if (params?.workspaceId)
    queryParams.append("workspaceId", params.workspaceId);

  const queryStr = queryParams.toString();
  const response = await API.get(
    `/notifications${queryStr ? `?${queryStr}` : ""}`
  );
  return response.data;
};

export const getUnreadNotificationCountQueryFn = async (
  workspaceId?: string
): Promise<UnreadCountResponseType> => {
  const params = workspaceId ? `?workspaceId=${workspaceId}` : "";
  const response = await API.get(`/notifications/unread-count${params}`);
  return response.data;
};

export const markNotificationAsReadMutationFn = async (
  notificationId: string
): Promise<{
  message: string;
  notification: NotificationItemType;
  unreadCount: number;
}> => {
  const response = await API.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsReadMutationFn = async (payload?: {
  workspaceId?: string;
}): Promise<{ message: string; unreadCount: number }> => {
  const response = await API.patch("/notifications/read-all", payload || {});
  return response.data;
};

export const deleteNotificationMutationFn = async (
  notificationId: string
): Promise<{ message: string; unreadCount: number }> => {
  const response = await API.delete(`/notifications/${notificationId}`);
  return response.data;
};

export const clearAllNotificationsMutationFn = async (payload?: {
  workspaceId?: string;
}): Promise<{ message: string; unreadCount: number }> => {
  const response = await API.delete("/notifications", { data: payload });
  return response.data;
};

// ********** TASK COMMENT API CALLS ****************
export const getTaskCommentsQueryFn = async ({
  workspaceId,
  taskId,
  pageNumber = 1,
  pageSize = 20,
  cursor,
  parentId,
  sortOrder = "desc",
}: GetCommentsPayloadType): Promise<CommentsResponseType> => {
  const queryParams = new URLSearchParams();
  if (pageNumber) queryParams.append("pageNumber", pageNumber.toString());
  if (pageSize) queryParams.append("pageSize", pageSize.toString());
  if (cursor) queryParams.append("cursor", cursor);
  if (sortOrder) queryParams.append("sortOrder", sortOrder);
  if (parentId !== undefined) queryParams.append("parentId", parentId === null ? "null" : parentId);

  const response = await API.get(
    `/comments/workspaces/${workspaceId}/tasks/${taskId}?${queryParams.toString()}`
  );
  return response.data;
};

export const getCommentRepliesQueryFn = async ({
  workspaceId,
  commentId,
  pageNumber = 1,
  pageSize = 20,
}: {
  workspaceId: string;
  commentId: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<CommentRepliesResponseType> => {
  const queryParams = new URLSearchParams();
  if (pageNumber) queryParams.append("pageNumber", pageNumber.toString());
  if (pageSize) queryParams.append("pageSize", pageSize.toString());

  const response = await API.get(
    `/comments/workspaces/${workspaceId}/comments/${commentId}/replies?${queryParams.toString()}`
  );
  return response.data;
};

export const createCommentMutationFn = async ({
  workspaceId,
  taskId,
  content,
  parentId,
  mentions,
  attachments,
}: CreateCommentPayloadType): Promise<{
  message: string;
  comment: CommentType;
}> => {
  const response = await API.post(
    `/comments/workspaces/${workspaceId}/tasks/${taskId}`,
    {
      content,
      parentId,
      mentions,
      attachments,
    }
  );
  return response.data;
};

export const updateCommentMutationFn = async ({
  workspaceId,
  commentId,
  content,
}: UpdateCommentPayloadType): Promise<{
  message: string;
  comment: CommentType;
}> => {
  const response = await API.patch(
    `/comments/workspaces/${workspaceId}/comments/${commentId}`,
    { content }
  );
  return response.data;
};

export const deleteCommentMutationFn = async ({
  workspaceId,
  commentId,
}: DeleteCommentPayloadType): Promise<{
  message: string;
}> => {
  const response = await API.delete(
    `/comments/workspaces/${workspaceId}/comments/${commentId}`
  );
  return response.data;
};

export const toggleCommentReactionMutationFn = async ({
  workspaceId,
  commentId,
  emoji,
}: ToggleCommentReactionPayloadType): Promise<{
  message: string;
  reactions: CommentType["reactions"];
}> => {
  const response = await API.post(
    `/comments/workspaces/${workspaceId}/comments/${commentId}/reactions`,
    { emoji }
  );
  return response.data;
};




