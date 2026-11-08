import React, { useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  BellOff,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useClearAllNotificationsMutation,
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "@/features/notification";
import { useSocketContext } from "@/context/socket-provider";
import { NotificationItem } from "./notification-item";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { cn } from "@/lib/utils";

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const workspaceId = useWorkspaceId();

  const { isConnected, unreadCount: liveUnreadCount } = useSocketContext();

  const { data: countData } = useGetUnreadNotificationCountQuery(workspaceId);
  const unreadCount = liveUnreadCount || countData?.unreadCount || 0;

  const { data, isLoading } = useGetNotificationsQuery({
    workspaceId: workspaceId || undefined,
    isRead: tab === "unread" ? false : undefined,
    limit: 30,
  });

  const markAsReadMutation = useMarkNotificationAsReadMutation();
  const markAllAsReadMutation = useMarkAllNotificationsAsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();
  const clearAllMutation = useClearAllNotificationsMutation();

  const notifications = data?.notifications || [];

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate({
      workspaceId: workspaceId || undefined,
    });
  };

  const handleClearAll = () => {
    clearAllMutation.mutate({
      workspaceId: workspaceId || undefined,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-muted"
          aria-label="Open notifications"
        >
          <Bell className="h-4 w-4 text-muted-foreground transition-transform hover:scale-105" />

          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50",
                unreadCount > 9 && "px-1.5"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] sm:w-[400px] p-0 shadow-lg border rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markAllAsReadMutation.isPending}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </Button>
            )}

            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={clearAllMutation.isPending}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                title="Clear all notifications"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pt-2 pb-1 border-b bg-background">
          <Tabs
            value={tab}
            onValueChange={(val) => setTab(val as "all" | "unread")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-7 p-0.5">
              <TabsTrigger value="all" className="text-xs h-6">
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs h-6">
                Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[360px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[280px] gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[280px] gap-2 text-muted-foreground px-4 text-center">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <BellOff className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground max-w-[220px]">
                {tab === "unread"
                  ? "You have caught up with all your notifications."
                  : "We'll notify you when tasks or workspace activity happens."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onClosePopover={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer with connection status */}
        <div className="flex items-center justify-between border-t px-4 py-2 bg-muted/20 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Wifi className="h-3 w-3" /> Live
                </span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <WifiOff className="h-3 w-3" /> Reconnecting
                </span>
              </>
            )}
          </div>

          <span className="text-[10px]">Real-time updates</span>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;

