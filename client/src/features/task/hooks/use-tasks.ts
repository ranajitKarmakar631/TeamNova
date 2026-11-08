import { keepPreviousData, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getAllTasksApi } from "../api/task.api";
import { AllTaskPayloadType, AllTaskResponseType } from "../types/task.types";
import { taskKeys } from "../task.keys";
import { CustomError } from "@/lib/api-error";

export const useTasksQuery = (
  {
    workspaceId,
    keyword,
    projectId,
    teamId,
    assignedTo,
    priority,
    status,
    dueDate,
    pageNumber = 1,
    pageSize = 10,
  }: AllTaskPayloadType,
  options?: Omit<
    UseQueryOptions<AllTaskResponseType, CustomError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<AllTaskResponseType, CustomError>({
    queryKey: taskKeys.list(
      workspaceId,
      projectId,
      teamId,
      keyword,
      priority,
      status,
      assignedTo,
      dueDate,
      pageNumber,
      pageSize
    ),
    queryFn: () =>
      getAllTasksApi({
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
      }),
    staleTime: 10 * 1000,
    placeholderData: keepPreviousData,
    enabled: !!workspaceId,
    ...options,
  });
};

export const useGetAllTasksQuery = useTasksQuery;
export default useTasksQuery;

