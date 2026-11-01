import { useParams } from "react-router-dom";
import { CheckCircle2, Users, Shield, BarChart3, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectHeader from "@/components/workspace/project/project-header";
import ProjectTeams from "@/components/workspace/project/project-teams";
import ProjectMembers from "@/components/workspace/project/project-members";
import ProjectKpiDashboard from "@/components/workspace/project/project-kpi-dashboard";
import TaskTable from "@/components/workspace/task/task-table";
import ScopeMembersList from "@/components/workspace/association/scope-members-list";

export const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return null;
  }

  return (
    <div className="w-full space-y-6 py-4 md:pt-3">
      {/* 1. Enhanced Project Header & Overview */}
      <ProjectHeader />

      {/* 2. Project Sections Tabs */}
      <Tabs defaultValue="tasks" className="w-full space-y-4">
        <TabsList className="w-full sm:w-auto justify-start border-0 bg-muted/60 p-1 h-auto flex flex-wrap gap-1 rounded-xl">
          <TabsTrigger value="tasks" className="gap-2 text-xs sm:text-sm py-2 px-3 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Tasks</span>
          </TabsTrigger>

          <TabsTrigger value="teams" className="gap-2 text-xs sm:text-sm py-2 px-3 rounded-lg">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span>Teams</span>
          </TabsTrigger>

          <TabsTrigger value="members" className="gap-2 text-xs sm:text-sm py-2 px-3 rounded-lg">
            <Users className="w-4 h-4 text-primary" />
            <span>Project Members</span>
          </TabsTrigger>

          <TabsTrigger value="kpis" className="gap-2 text-xs sm:text-sm py-2 px-3 rounded-lg">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <span>KPI Dashboard</span>
          </TabsTrigger>

          <TabsTrigger value="access" className="gap-2 text-xs sm:text-sm py-2 px-3 rounded-lg">
            <UserCheck className="w-4 h-4 text-slate-500" />
            <span>Access & Roles</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Tasks Table */}
        <TabsContent value="tasks" className="space-y-4 pt-1">
          <TaskTable />
        </TabsContent>

        {/* Tab 2: Project Teams */}
        <TabsContent value="teams" className="space-y-4 pt-1">
          <ProjectTeams />
        </TabsContent>

        {/* Tab 3: Project Members Directory */}
        <TabsContent value="members" className="space-y-4 pt-1">
          <ProjectMembers />
        </TabsContent>

        {/* Tab 4: Project KPI Dashboard */}
        <TabsContent value="kpis" className="space-y-4 pt-1">
          <ProjectKpiDashboard />
        </TabsContent>

        {/* Tab 5: Access & Roles Management */}
        <TabsContent value="access" className="space-y-4 pt-1">
          <ScopeMembersList
            scopeType="PROJECT"
            scopeId={projectId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetails;
