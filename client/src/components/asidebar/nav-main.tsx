"use client";

import {
  LucideIcon,
  Settings,
  UsersRound,
  Backpack,
  CheckCircle,
  UserRound,
  LayoutDashboard,
  Send,
  MessageSquare,
  Video,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useAuthContext } from "@/context/auth-provider";
import { Permissions } from "@/constant";

type ItemType = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export function NavMain() {
  const { hasPermission } = useAuthContext();

  const canManageSettings = hasPermission(
    Permissions.MANAGE_WORKSPACE_SETTINGS
  );
  const canInviteMember = hasPermission(
    Permissions.INVITE_MEMBER
  );

  const workspaceId = useWorkspaceId();
  const location = useLocation();

  const pathname = location.pathname;

  const items: ItemType[] = [
    {
      title: "Dashboard",
      url: `/workspace/${workspaceId}`,
      icon: LayoutDashboard,
    },
    {
      title: "Projects",
      url: `/workspace/${workspaceId}/projects`,
      icon: Backpack,
    },
    {
      title: "Teams",
      url: `/workspace/${workspaceId}/teams`,
      icon: UsersRound  ,
    },
    {
      title: "Meetings",
      url: `/workspace/${workspaceId}/meetings`,
      icon: Video,
    },
    {
      title: "Tasks",
      url: `/workspace/${workspaceId}/tasks`,
      icon: CheckCircle,
    },
    {
      title: "Members",
      url: `/workspace/${workspaceId}/members`,
      icon: UserRound,
    },
    {
      title: "Chat",
      url: `/workspace/${workspaceId}/chat`,
      icon: MessageSquare,
    },
    ...(canInviteMember
      ? [
          {
            title: "Send Invite",
            url: `/workspace/${workspaceId}/send-invite`,
            icon: Send,
          },
        ]
      : []),
    ...(canManageSettings
      ? [
          {
            title: "Settings",
            url: `/workspace/${workspaceId}/settings`,
            icon: Settings,
          },
        ]
      : []),
  ];
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton isActive={item.url === pathname} asChild>
              <Link to={item.url} className="!text-[15px]">
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
