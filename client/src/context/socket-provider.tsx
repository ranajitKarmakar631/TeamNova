import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import useAuth from "@/hooks/api/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { NOTIFICATION_QUERY_KEYS } from "@/hooks/api/use-notifications";
import { toast } from "@/hooks/use-toast";
import { NotificationItemType } from "@/types/notification.type";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  unreadCount: 0,
});

export const useSocketContext = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: authData } = useAuth();
  const user = authData?.user;
  const queryClient = useQueryClient();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!user?._id) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const s = connectSocket();
    setSocket(s);

    const onConnect = () => {
      setIsConnected(true);
      s.emit("notification:get_unread");
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onNewNotification = (notification: NotificationItemType) => {
      // Do not display toast to the user who triggered/sent the action
      const senderId =
        typeof notification.sender === "object"
          ? notification.sender?._id
          : notification.sender;
      if (senderId && user?._id && String(senderId) === String(user._id)) {
        return;
      }

      toast({
        title: notification.title,
        description: notification.message,
      });

      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    };

    const onUnreadCount = (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount);
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    };

    const onNotificationRead = (data: {
      notificationId: string;
      unreadCount: number;
    }) => {
      setUnreadCount(data.unreadCount);
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    };

    const onAllNotificationsRead = (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount || 0);
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    };

    const onNotificationDeleted = (data: {
      notificationId: string;
      unreadCount: number;
    }) => {
      setUnreadCount(data.unreadCount);
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("notification:new", onNewNotification);
    s.on("notification:unread_count", onUnreadCount);
    s.on("notification:read", onNotificationRead);
    s.on("notification:all_read", onAllNotificationsRead);
    s.on("notification:deleted", onNotificationDeleted);

    if (s.connected) {
      onConnect();
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("notification:new", onNewNotification);
      s.off("notification:unread_count", onUnreadCount);
      s.off("notification:read", onNotificationRead);
      s.off("notification:all_read", onAllNotificationsRead);
      s.off("notification:deleted", onNotificationDeleted);
    };
  }, [user?._id, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, unreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};
