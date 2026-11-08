import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCommentApi,
  deleteCommentApi,
  getCommentRepliesApi,
  getTaskCommentsApi,
  toggleCommentReactionApi,
  updateCommentApi,
} from "../api/task.api";
import { toast } from "@/hooks/use-toast";
import {
  CreateCommentPayloadType,
  GetCommentsPayloadType,
  ToggleCommentReactionPayloadType,
  UpdateCommentPayloadType,
} from "../types/task.types";
import { taskKeys } from "../task.keys";

export const useTaskComments = ({
  workspaceId,
  taskId,
  pageNumber = 1,
  pageSize = 20,
  parentId,
  sortOrder = "desc",
  enabled = true,
}: GetCommentsPayloadType & { enabled?: boolean }) => {
  return useQuery({
    queryKey: taskKeys.comments(
      workspaceId,
      taskId,
      pageNumber,
      pageSize,
      parentId,
      sortOrder
    ),
    queryFn: () =>
      getTaskCommentsApi({
        workspaceId,
        taskId,
        pageNumber,
        pageSize,
        parentId,
        sortOrder,
      }),
    enabled: !!workspaceId && !!taskId && enabled,
    staleTime: 30 * 1000,
  });
};

export const useCommentReplies = ({
  workspaceId,
  commentId,
  pageNumber = 1,
  pageSize = 20,
  enabled = true,
}: {
  workspaceId: string;
  commentId: string;
  pageNumber?: number;
  pageSize?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: taskKeys.replies(workspaceId, commentId, pageNumber, pageSize),
    queryFn: () =>
      getCommentRepliesApi({
        workspaceId,
        commentId,
        pageNumber,
        pageSize,
      }),
    enabled: !!workspaceId && !!commentId && enabled,
    staleTime: 30 * 1000,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentPayloadType) =>
      createCommentApi(payload),
    onSuccess: (_, variables) => {
      // Invalidate only the specific task's comments list
      queryClient.invalidateQueries({
        queryKey: ["task-comments", variables.workspaceId, variables.taskId],
      });
      // Invalidate replies if this was a reply
      if (variables.parentId) {
        queryClient.invalidateQueries({
          queryKey: ["comment-replies", variables.workspaceId, variables.parentId],
        });
      }
      // Update commentCount in "all-tasks" cache directly without invalidating/refetching the whole page
      queryClient.setQueriesData({ queryKey: ["all-tasks"] }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.tasks)) return oldData;
        return {
          ...oldData,
          tasks: oldData.tasks.map((t: any) =>
            t._id === variables.taskId
              ? { ...t, commentCount: (t.commentCount || 0) + 1 }
              : t
          ),
        };
      });
      // Update single task query if active
      queryClient.setQueryData(["task", variables.taskId], (oldTask: any) => {
        if (!oldTask) return oldTask;
        return {
          ...oldTask,
          commentCount: (oldTask.commentCount || 0) + 1,
        };
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to post comment",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCommentPayloadType) =>
      updateCommentApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.allComments,
      });
      queryClient.invalidateQueries({
        queryKey: taskKeys.allReplies,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update comment",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { workspaceId: string; commentId: string; taskId?: string }) =>
      deleteCommentApi({
        workspaceId: payload.workspaceId,
        commentId: payload.commentId,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.allComments,
      });
      queryClient.invalidateQueries({
        queryKey: taskKeys.allReplies,
      });
      if (variables.taskId) {
        queryClient.setQueriesData({ queryKey: ["all-tasks"] }, (oldData: any) => {
          if (!oldData || !Array.isArray(oldData.tasks)) return oldData;
          return {
            ...oldData,
            tasks: oldData.tasks.map((t: any) =>
              t._id === variables.taskId
                ? { ...t, commentCount: Math.max(0, (t.commentCount || 1) - 1) }
                : t
            ),
          };
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete comment",
        variant: "destructive",
      });
    },
  });
};

export const useToggleCommentReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ToggleCommentReactionPayloadType) =>
      toggleCommentReactionApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.allComments,
      });
      queryClient.invalidateQueries({
        queryKey: taskKeys.allReplies,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update reaction",
        variant: "destructive",
      });
    },
  });
};

