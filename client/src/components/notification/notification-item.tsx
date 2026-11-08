import React from "react";
import {
  NotificationItemType,
  NotificationType,
} from "@/features/notification";
import { formatDistanceToNow } from "date-fns";
import {
  ClipboardList,
  RefreshCw,
  AlertCircle,
  Mail,
  UserCheck,
  FolderPlus,
  Users,
  Bell,
  Trash2,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import useWorkspaceId from "@/hooks/use-workspace-id";

interface NotificationItemProps {
  notification: NotificationItemType;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClosePopover?: () => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "TASK_ASSIGNED":
      return <ClipboardList className="h-4 w-4 text-blue-500" />;
    case "TASK_STATUS_CHANGED":
      return <RefreshCw className="h-4 w-4 text-amber-500" />;
    case "TASK_PRIORITY_CHANGED":
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case "WORKSPACE_INVITE":
      return <Mail className="h-4 w-4 text-purple-500" />;
    case "WORKSPACE_MEMBER_JOINED":
      return <UserCheck className="h-4 w-4 text-green-500" />;
    case "PROJECT_MEMBER_ADDED":
      return <FolderPlus className="h-4 w-4 text-indigo-500" />;
    case "TEAM_MEMBER_ADDED":
      return <Users className="h-4 w-4 text-teal-500" />;
    default:
      return <Bell className="h-4 w-4 text-primary" />;
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClosePopover,
}) => {
  const navigate = useNavigate();
  const currentWorkspaceId = useWorkspaceId();

  const formattedTime = (() => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
      });
    } catch {
      return "just now";
    }
  })();

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }

    const wsId = notification.workspace?._id || currentWorkspaceId;

    if (notification.data?.taskId && wsId) {
      navigate(`/workspace/${wsId}/tasks`);
      if (onClosePopover) onClosePopover();
    } else if (notification.data?.projectId && wsId) {
      navigate(`/workspace/${wsId}/project/${notification.data.projectId}`);
      if (onClosePopover) onClosePopover();
    } else if (wsId) {
      navigate(`/workspace/${wsId}`);
      if (onClosePopover) onClosePopover();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex items-start gap-3 p-3 transition-colors hover:bg-muted/60 cursor-pointer border-b last:border-b-0",
        !notification.isRead && "bg-primary/5 dark:bg-primary/10"
      )}
    >
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background border shadow-xs">
        {getNotificationIcon(notification.type)}
      </div>

      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "text-xs font-medium leading-none line-clamp-1",
              !notification.isRead && "font-semibold text-foreground"
            )}
          >
            {notification.title}
          </p>

          {!notification.isRead && (
            <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
          <span>{formattedTime}</span>

          {notification.priority === "URGENT" && (
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">
              Urgent
            </Badge>
          )}

          {notification.priority === "HIGH" && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-orange-100 text-orange-700">
              High
            </Badge>
          )}
        </div>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-1"
      >
        {!notification.isRead && (
          <button
            title="Mark as read"
            onClick={() => onMarkAsRead(notification._id)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          title="Delete notification"
          onClick={() => onDelete(notification._id)}
          className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

