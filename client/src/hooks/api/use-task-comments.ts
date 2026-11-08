import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCommentMutationFn,
  deleteCommentMutationFn,
  getCommentRepliesQueryFn,
  getTaskCommentsQueryFn,
  toggleCommentReactionMutationFn,
  updateCommentMutationFn,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import {
  CreateCommentPayloadType,
  GetCommentsPayloadType,
  ToggleCommentReactionPayloadType,
  UpdateCommentPayloadType,
} from "@/types/api.type";

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
    queryKey: [
      "task-comments",
      workspaceId,
      taskId,
      pageNumber,
      pageSize,
      parentId,
      sortOrder,
    ],
    queryFn: () =>
      getTaskCommentsQueryFn({
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
    queryKey: ["comment-replies", workspaceId, commentId, pageNumber, pageSize],
    queryFn: () =>
      getCommentRepliesQueryFn({
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
      createCommentMutationFn(payload),
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
      // Silent on user side - no intrusive success toast popup
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
      updateCommentMutationFn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["task-comments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["comment-replies"],
      });
      // Silent inline update - no toast popup
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
      deleteCommentMutationFn({
        workspaceId: payload.workspaceId,
        commentId: payload.commentId,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["task-comments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["comment-replies"],
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
      toggleCommentReactionMutationFn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["task-comments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["comment-replies"],
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
