import API from "@/lib/axios-client";
import {
  AllTaskPayloadType,
  AllTaskResponseType,
  CommentRepliesResponseType,
  CommentsResponseType,
  CreateCommentPayloadType,
  CreateTaskPayloadType,
  DeleteCommentPayloadType,
  EditTaskPayloadType,
  GetCommentsPayloadType,
  ToggleCommentReactionPayloadType,
  UpdateCommentPayloadType,
} from "../types/task.types";

export const createTaskApi = async ({
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

export const editTaskApi = async ({
  taskId,
  projectId,
  workspaceId,
  data,
}: EditTaskPayloadType): Promise<{ message: string }> => {
  const response = await API.put(
    `/task/${taskId}/project/${projectId}/workspace/${workspaceId}/update/`,
    data
  );
  return response.data;
};

export const getAllTasksApi = async ({
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
  const queryParams = new URLSearchParams();
  if (keyword) queryParams.append("keyword", keyword);
  if (projectId) queryParams.append("projectId", projectId);
  if (teamId) queryParams.append("teamId", teamId);
  if (assignedTo) queryParams.append("assignedTo", assignedTo);
  if (priority) queryParams.append("priority", priority);
  if (status) queryParams.append("status", status);
  if (dueDate) queryParams.append("dueDate", dueDate);
  if (pageNumber) queryParams.append("pageNumber", pageNumber.toString());
  if (pageSize) queryParams.append("pageSize", pageSize.toString());

  const response = await API.get(
    `/task/workspace/${workspaceId}/all?${queryParams.toString()}`
  );
  return response.data;
};

export const deleteTaskApi = async ({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}): Promise<{ message: string }> => {
  const response = await API.delete(
    `/task/${taskId}/workspace/${workspaceId}/delete`
  );
  return response.data;
};

// ********** TASK COMMENTS API ****************

export const getTaskCommentsApi = async ({
  workspaceId,
  taskId,
  pageNumber = 1,
  pageSize = 20,
  cursor,
  parentId = null,
  sortOrder = "desc",
}: GetCommentsPayloadType): Promise<CommentsResponseType> => {
  const queryParams = new URLSearchParams();
  queryParams.append("pageNumber", pageNumber.toString());
  queryParams.append("pageSize", pageSize.toString());
  if (cursor) queryParams.append("cursor", cursor);
  if (parentId) queryParams.append("parentId", parentId);
  if (sortOrder) queryParams.append("sortOrder", sortOrder);

  const response = await API.get(
    `/comment/workspace/${workspaceId}/task/${taskId}?${queryParams.toString()}`
  );
  return response.data;
};

export const getCommentRepliesApi = async ({
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
  const response = await API.get(
    `/comment/workspace/${workspaceId}/comment/${commentId}/replies?pageNumber=${pageNumber}&pageSize=${pageSize}`
  );
  return response.data;
};

export const createCommentApi = async ({
  workspaceId,
  taskId,
  content,
  parentId,
  mentions,
  attachments,
}: CreateCommentPayloadType) => {
  const response = await API.post(
    `/comment/workspace/${workspaceId}/task/${taskId}`,
    {
      content,
      parentId,
      mentions,
      attachments,
    }
  );
  return response.data;
};

export const updateCommentApi = async ({
  workspaceId,
  commentId,
  content,
}: UpdateCommentPayloadType) => {
  const response = await API.put(
    `/comment/workspace/${workspaceId}/comment/${commentId}`,
    { content }
  );
  return response.data;
};

export const deleteCommentApi = async ({
  workspaceId,
  commentId,
}: DeleteCommentPayloadType) => {
  const response = await API.delete(
    `/comment/workspace/${workspaceId}/comment/${commentId}`
  );
  return response.data;
};

export const toggleCommentReactionApi = async ({
  workspaceId,
  commentId,
  emoji,
}: ToggleCommentReactionPayloadType) => {
  const response = await API.post(
    `/comment/workspace/${workspaceId}/comment/${commentId}/react`,
    { emoji }
  );
  return response.data;
};

