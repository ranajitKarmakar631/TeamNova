import React, { useState } from "react";
import { MessageSquare, ArrowUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import CommentInput from "./comment-input";
import CommentItem from "./comment-item";
import {
  useCreateComment,
  useTaskComments,
} from "@/hooks/api/use-task-comments";
import useAuth from "@/hooks/api/use-auth";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useAuthContext } from "@/context/auth-provider";
import { Permissions } from "@/constant";

interface TaskCommentsProps {
  taskId: string;
  projectId?: string;
  members?: Array<{
    _id: string;
    name: string;
    profilePicture?: string | null;
    email?: string;
  }>;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({
  taskId,
  members = [],
}) => {
  const workspaceId = useWorkspaceId();
  const { data: authData } = useAuth();
  const currentUserId = authData?.user?._id;

  const { hasPermission } = useAuthContext();
  const canModerate = hasPermission(Permissions.TASK_DELETE);

  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 15;

  // React Query Fetch
  const { data, isLoading, isFetching } = useTaskComments({
    workspaceId,
    taskId,
    pageNumber,
    pageSize,
    sortOrder,
    parentId: null, // Only fetch top-level comments for scalable pagination
  });

  const { mutateAsync: createComment, isPending: isPosting } = useCreateComment();

  const comments = data?.comments || [];
  const pagination = data?.pagination;
  const totalCount = pagination?.totalCount ?? comments.length;

  const handlePostRootComment = async ({
    content,
    mentions,
  }: {
    content: any;
    mentions?: string[];
  }) => {
    await createComment({
      workspaceId,
      taskId,
      content,
      parentId: null,
      mentions,
    });
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setPageNumber(1);
  };

  const currentUserName = authData?.user?.name || "Me";
  const currentUserAvatar = authData?.user?.profilePicture;

  return (
    <div className="flex flex-col gap-3.5 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-foreground/80" />
          <h3 className="text-xs font-semibold text-foreground">
            Activity & Comments
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {totalCount} {totalCount === 1 ? "event" : "events"}
          </span>

          {totalCount > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleSortOrder}
              className="h-6 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-1.5"
            >
              <ArrowUpDown className="h-3 w-3" />
              <span>{sortOrder === "desc" ? "Newest" : "Oldest"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col gap-3 py-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground">
            <p className="text-[11px]">No activity or comments yet.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              workspaceId={workspaceId}
              taskId={taskId}
              currentUserId={currentUserId}
              canModerate={canModerate}
              isReply={false}
              members={members}
            />
          ))
        )}

        {/* Scalable pagination controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
            <span>
              Page {pagination.pageNumber} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.pageNumber <= 1 || isFetching}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                className="h-6 px-2 text-[11px]"
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  pagination.pageNumber >= pagination.totalPages || isFetching
                }
                onClick={() =>
                  setPageNumber((p) => Math.min(pagination.totalPages, p + 1))
                }
                className="h-6 px-2 text-[11px]"
              >
                {isFetching ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />
                ) : null}
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Comment Input Box matching Image 2 */}
      <div className="flex items-start gap-2.5 pt-2 border-t border-border/40">
        <Avatar className="h-6 w-6 text-[10px] shrink-0 mt-2">
          {currentUserAvatar && (
            <AvatarImage src={currentUserAvatar} alt={currentUserName} />
          )}
          <AvatarFallback
            className={`${getAvatarColor(currentUserName)} text-white font-medium`}
          >
            {getAvatarFallbackText(currentUserName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <CommentInput
            taskId={taskId}
            workspaceId={workspaceId}
            parentId={null}
            placeholder="Write a comment or type '@' to mention..."
            submitLabel="Post"
            isSubmitting={isPosting}
            onSubmit={handlePostRootComment}
            members={members}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskComments;

