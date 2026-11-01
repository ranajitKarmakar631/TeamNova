import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "./ui/separator";
import { Link, useLocation } from "react-router-dom";
import useWorkspaceId from "@/hooks/use-workspace-id";

interface BreadcrumbSegment {
  label: string;
  href?: string | null;
}

const Header = () => {
  const location = useLocation();
  const workspaceId = useWorkspaceId();
  const pathname = location.pathname;

  const getBreadcrumbs = (): BreadcrumbSegment[] => {
    if (pathname.includes("/projects")) {
      return [{ label: "Projects" }];
    }
    if (pathname.includes("/project/")) {
      return [
        { label: "Projects", href: `/workspace/${workspaceId}/projects` },
        { label: "Project Details" },
      ];
    }
    if (pathname.includes("/teams")) {
      return [{ label: "Teams" }];
    }
    if (pathname.includes("/team/")) {
      return [
        { label: "Teams", href: `/workspace/${workspaceId}/teams` },
        { label: "Team Details" },
      ];
    }
    if (pathname.includes("/tasks")) {
      return [{ label: "Tasks" }];
    }
    if (pathname.includes("/members")) {
      return [{ label: "Members" }];
    }
    if (pathname.includes("/settings")) {
      return [{ label: "Settings" }];
    }
    if (pathname.includes("/send-invite") || pathname.includes("/invite")) {
      return [{ label: "Invite Member" }];
    }
    return [];
  };

  const breadcrumbs = getBreadcrumbs();
  const isDashboard = breadcrumbs.length === 0;

  return (
    <header className="flex sticky top-0 z-50 bg-white dark:bg-background h-12 shrink-0 items-center border-b">
      <div className="flex flex-1 items-center gap-2 px-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="text-[15px]">
              {isDashboard ? (
                <BreadcrumbPage className="line-clamp-1 font-medium">
                  Dashboard
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={`/workspace/${workspaceId}`}>Dashboard</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>

            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.label}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="text-[15px]">
                    {isLast || !crumb.href ? (
                      <BreadcrumbPage className="line-clamp-1 font-medium">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
};

export default Header;
