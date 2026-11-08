import React, { useState, useEffect } from "react";
import { formatDistanceToNowStrict, format } from "date-fns";
import { CommentType } from "@/types/api.type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import {
  CornerDownRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Smile,
  Loader2,
  Lock,
} from "lucide-react";
import CommentInput from "./comment-input";
import LexicalEditor from "@/lib/lexical";
import {
  useCommentReplies,
  useCreateComment,
  useDeleteComment,
  useToggleCommentReaction,
  useUpdateComment,
} from "@/hooks/api/use-task-comments";
import {
  encryptCommentContent,
  decryptCommentContent,
} from "@/lib/crypto/e2ee";

interface CommentItemProps {
  comment: CommentType;
  workspaceId: string;
  taskId: string;
  currentUserId?: string;
  canModerate?: boolean;
  isReply?: boolean;
  members?: Array<{
    _id: string;
    name: string;
    profilePicture?: string | null;
  }>;
}

const QUICK_REACTIONS = ["👍", "❤️", "🚀", "🎉", "👀"];

export const CommentItem: React.FC<CommentItemProps> = React.memo(({
  comment,
  workspaceId,
  taskId,
  currentUserId,
  canModerate = false,
  isReply = false,
  members = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  // E2EE Decrypted content state
  const isEncrypted = Boolean(
    comment.content &&
      typeof comment.content === "object" &&
      comment.content.isEncrypted
  );
  const [decryptedContent, setDecryptedContent] = useState<any>(
    isEncrypted ? null : comment.content
  );
  const [isDecrypting, setIsDecrypting] = useState<boolean>(isEncrypted);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (
      comment.content &&
      typeof comment.content === "object" &&
      comment.content.isEncrypted
    ) {
      setIsDecrypting(true);
      decryptCommentContent(comment.content, workspaceId)
        .then((res) => {
          if (!isMounted) return;
          setIsDecrypting(false);
          if (res.error) {
            setDecryptError(res.error);
          } else {
            setDecryptedContent(res.content);
            setDecryptError(null);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setIsDecrypting(false);
          setDecryptError("Failed to decrypt comment.");
        });
    } else {
      setDecryptedContent(comment.content);
      setIsDecrypting(false);
      setDecryptError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [comment.content, workspaceId]);

  const isAuthor = currentUserId === comment.author?._id;
  const canDelete = isAuthor || canModerate;

  // React Query Hooks
  const { mutateAsync: updateComment, isPending: isUpdating } = useUpdateComment();
  const { mutateAsync: deleteComment, isPending: isDeleting } = useDeleteComment();
  const { mutateAsync: toggleReaction } = useToggleCommentReaction();
  const { mutateAsync: createComment, isPending: isPostingReply } = useCreateComment();

  // Load replies when expanded
  const { data: repliesData, isLoading: isLoadingReplies } = useCommentReplies({
    workspaceId,
    commentId: comment._id,
    enabled: showReplies,
  });

  const replies = repliesData?.replies || [];

  const handleEditSubmit = async ({ content }: { content: any }) => {
    const encryptedContent = await encryptCommentContent(content, workspaceId);
    await updateComment({
      workspaceId,
      commentId: comment._id,
      content: encryptedContent,
    });
    setDecryptedContent(content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this comment?")) {
      await deleteComment({
        workspaceId,
        commentId: comment._id,
        taskId,
      });
    }
  };

  const handleReactionClick = (emoji: string) => {
    toggleReaction({
      workspaceId,
      commentId: comment._id,
      emoji,
    });
  };

  const handleReplySubmit = async ({
    content,
    mentions,
  }: {
    content: any;
    mentions?: string[];
  }) => {
    const encryptedContent = await encryptCommentContent(content, workspaceId);
    await createComment({
      workspaceId,
      taskId,
      parentId: comment._id,
      content: encryptedContent,
      mentions,
    });
    setIsReplying(false);
    setShowReplies(true);
  };

  const authorName = comment.author?.name || "Unknown";
  const authorInitials = getAvatarFallbackText(authorName);
  const authorBg = getAvatarColor(authorName);

  return (
    <div
      className={`group/comment flex flex-col gap-1.5 rounded-lg transition-colors ${
        isReply ? "ml-8 pl-3 border-l-2 border-primary/30" : ""
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Author Avatar */}
        <Avatar className="h-6 w-6 text-[10px] shrink-0 mt-0.5">
          {comment.author?.profilePicture && (
            <AvatarImage src={comment.author.profilePicture} alt={authorName} />
          )}
          <AvatarFallback className={`${authorBg} text-white font-medium`}>
            {authorInitials}
          </AvatarFallback>
        </Avatar>

        {/* Comment Box */}
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-semibold text-foreground truncate">
                {authorName}
              </span>
              {isEncrypted && (
                <span
                  className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20"
                  title="End-to-end encrypted with AES-256-GCM"
                >
                  <Lock className="h-2.5 w-2.5" />
                  <span>E2EE</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-muted-foreground">
                {formatDistanceToNowStrict(new Date(comment.createdAt), {
                  addSuffix: true,
                })}
              </span>

              {comment.isEdited && comment.editedAt && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[10px] text-muted-foreground/80 italic cursor-default">
                        (edited)
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">
                        Edited on {format(new Date(comment.editedAt), "PPP p")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Actions Dropdown */}
              {!comment.isDeleted && (isAuthor || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-28">
                    {isAuthor && (
                      <DropdownMenuItem
                        onClick={() => setIsEditing(true)}
                        className="gap-2 text-xs cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Comment Bubble Text */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs text-foreground/90 leading-relaxed shadow-2xs">
            {isEditing ? (
              <CommentInput
                taskId={taskId}
                workspaceId={workspaceId}
                initialContent={decryptedContent || comment.content}
                submitLabel="Save"
                isSubmitting={isUpdating}
                onCancel={() => setIsEditing(false)}
                onSubmit={handleEditSubmit}
                members={members}
              />
            ) : comment.isDeleted ? (
              <span className="text-muted-foreground italic text-xs">
                {typeof comment.content === "string"
                  ? comment.content
                  : "This comment has been deleted."}
              </span>
            ) : isDecrypting ? (
              <div className="flex items-center gap-2 py-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                <span className="text-[11px]">Decrypting message...</span>
              </div>
            ) : decryptError ? (
              <div className="flex items-center gap-1.5 text-rose-500 py-1">
                <Lock className="h-3.5 w-3.5" />
                <span className="text-[11px]">{decryptError}</span>
              </div>
            ) : (
              <LexicalEditor
                value={decryptedContent}
                readOnly={true}
                showToolbar={false}
                className="lx-bubble-view"
              />
            )}
          </div>

          {/* Footer Reactions & Reply Trigger */}
          {!comment.isDeleted && !isEditing && (
            <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
              {/* Reaction badges */}
              {comment.reactions?.map((reaction) => {
                const hasUserReacted = reaction.users.some(
                  (u) => (typeof u === "string" ? u : u._id) === currentUserId
                );
                return (
                  <button
                    key={reaction.emoji}
                    type="button"
                    onClick={() => handleReactionClick(reaction.emoji)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] border transition-all cursor-pointer ${
                      hasUserReacted
                        ? "bg-primary/10 border-primary/40 text-primary font-medium"
                        : "bg-muted/40 border-border/60 hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <span>{reaction.emoji}</span>
                    <span>{reaction.users.length}</span>
                  </button>
                );
              })}

              {/* Quick Reaction Button Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
                    title="Add reaction"
                  >
                    <Smile className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="flex items-center gap-1 p-1"
                >
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleReactionClick(emoji)}
                      className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center text-sm cursor-pointer transition-transform hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Reply Button */}
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying((prev) => !prev)}
                  className="h-5 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                >
                  <CornerDownRight className="h-3 w-3" />
                  <span>Reply</span>
                </Button>
              )}

              {/* View / Toggle Replies */}
              {!isReply && (comment.replyCount > 0 || replies.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies((prev) => !prev)}
                  className="h-5 px-1.5 text-[11px] text-primary hover:text-primary/80 gap-1 font-medium"
                >
                  {showReplies ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      <span>Hide replies</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      <span>
                        {comment.replyCount}{" "}
                        {comment.replyCount === 1 ? "reply" : "replies"}
                      </span>
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Inline Reply Form */}
          {isReplying && (
            <div className="pt-2">
              <CommentInput
                taskId={taskId}
                workspaceId={workspaceId}
                parentId={comment._id}
                placeholder={`Reply to ${authorName}...`}
                submitLabel="Reply"
                isSubmitting={isPostingReply}
                onCancel={() => setIsReplying(false)}
                onSubmit={handleReplySubmit}
                members={members}
              />
            </div>
          )}

          {/* Thread Replies List */}
          {showReplies && (
            <div className="flex flex-col gap-2 pt-2">
              {isLoadingReplies ? (
                <div className="py-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Loading replies...</span>
                </div>
              ) : (
                replies.map((reply) => (
                  <CommentItem
                    key={reply._id}
                    comment={reply}
                    workspaceId={workspaceId}
                    taskId={taskId}
                    currentUserId={currentUserId}
                    canModerate={canModerate}
                    isReply={true}
                    members={members}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CommentItem.displayName = "CommentItem";

export default CommentItem;
