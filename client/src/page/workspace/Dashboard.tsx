import { Plus, Backpack, Shield, CheckCircle, Users, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import useCreateProjectDialog from "@/hooks/use-create-project-dialog";
import WorkspaceAnalytics from "@/components/workspace/workspace-analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecentProjects from "@/components/workspace/project/recent-projects";
import RecentTasks from "@/components/workspace/task/recent-tasks";
import RecentMembers from "@/components/workspace/member/recent-members";
import RecentTeams from "@/components/workspace/team/recent-teams";
import MyAssociationsList from "@/components/workspace/association/my-associations-list";
import { useAuthContext } from "@/context/auth-provider";
import { Permissions } from "@/constant";

const WorkspaceDashboard = () => {
  const { onOpen } = useCreateProjectDialog();
  const { hasPermission } = useAuthContext();
  const canCreateProject = hasPermission(Permissions.PROJECT_CREATE);

  return (
    <main className="flex flex-1 flex-col py-4 md:pt-3">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Workspace Overview
          </h2>
          <p className="text-muted-foreground text-sm">
            Here&apos;s an overview of your projects, teams, tasks, and team associations!
          </p>
        </div>
        {canCreateProject && (
          <Button onClick={onOpen} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        )}
      </div>

      <WorkspaceAnalytics />

      <div className="mt-6">
        <Tabs defaultValue="projects" className="w-full border rounded-xl p-3 shadow-sm bg-card">
          <TabsList className="w-full justify-start border-0 bg-muted/60 px-1 h-11 flex-wrap gap-1">
            <TabsTrigger className="py-2 gap-1.5 text-xs sm:text-sm" value="projects">
              <Backpack className="w-3.5 h-3.5" />
              <span>Recent Projects</span>
            </TabsTrigger>
            <TabsTrigger className="py-2 gap-1.5 text-xs sm:text-sm" value="teams">
              <Shield className="w-3.5 h-3.5" />
              <span>Teams</span>
            </TabsTrigger>
            <TabsTrigger className="py-2 gap-1.5 text-xs sm:text-sm" value="my-associations">
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              <span>My Teams & Projects</span>
            </TabsTrigger>
            <TabsTrigger className="py-2 gap-1.5 text-xs sm:text-sm" value="tasks">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Recent Tasks</span>
            </TabsTrigger>
            <TabsTrigger className="py-2 gap-1.5 text-xs sm:text-sm" value="members">
              <Users className="w-3.5 h-3.5" />
              <span>Recent Members</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <RecentProjects />
          </TabsContent>
          <TabsContent value="teams">
            <RecentTeams />
          </TabsContent>
          <TabsContent value="my-associations">
            <MyAssociationsList />
          </TabsContent>
          <TabsContent value="tasks">
            <RecentTasks />
          </TabsContent>
          <TabsContent value="members">
            <RecentMembers />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default WorkspaceDashboard;
