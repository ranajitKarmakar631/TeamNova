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
      // Invalidate comments list
      queryClient.invalidateQueries({
        queryKey: ["task-comments", variables.workspaceId, variables.taskId],
      });
      // Invalidate replies if this was a reply
      if (variables.parentId) {
        queryClient.invalidateQueries({
          queryKey: ["comment-replies", variables.workspaceId, variables.parentId],
        });
      }
      // Invalidate task queries so commentCount updates
      queryClient.invalidateQueries({
        queryKey: ["all-tasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["task", variables.taskId],
      });
      toast({
        title: "Success",
        description: "Comment posted",
        variant: "success",
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
      updateCommentMutationFn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["task-comments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["comment-replies"],
      });
      toast({
        title: "Success",
        description: "Comment updated",
        variant: "success",
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
      deleteCommentMutationFn({
        workspaceId: payload.workspaceId,
        commentId: payload.commentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["task-comments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["comment-replies"],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-tasks"],
      });
      toast({
        title: "Success",
        description: "Comment deleted",
        variant: "success",
      });
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
