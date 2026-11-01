import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Shield,
  Layers,
  TrendingUp,
  Activity,
  Loader,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useWorkspaceId from "@/hooks/use-workspace-id";
import {
  getProjectMembersQueryFn,
  getProjectOverviewQueryFn,
  getProjectTeamsQueryFn,
} from "@/lib/api";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";

export const ProjectKpiDashboard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const workspaceId = useWorkspaceId();

  const { data: overviewData, isLoading: isLoadingOverview } = useQuery({
    queryKey: ["project-overview", projectId],
    queryFn: () =>
      getProjectOverviewQueryFn({
        workspaceId,
        projectId: projectId!,
      }),
    enabled: Boolean(workspaceId && projectId),
  });

  const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
    queryKey: ["project-teams", projectId],
    queryFn: () =>
      getProjectTeamsQueryFn({
        workspaceId,
        projectId: projectId!,
      }),
    enabled: Boolean(workspaceId && projectId),
  });

  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () =>
      getProjectMembersQueryFn({
        workspaceId,
        projectId: projectId!,
      }),
    enabled: Boolean(workspaceId && projectId),
  });

  const isLoading = isLoadingOverview || isLoadingTeams || isLoadingMembers;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpis = overviewData?.kpis;
  const teams = teamsData?.teams || [];
  const members = membersData?.members || [];

  const totalTasks = kpis?.totalTasks || 0;
  const completedTasks = kpis?.completedTasks || 0;
  const inProgressTasks = kpis?.inProgressTasks || 0;
  const pendingTasks = kpis?.pendingTasks || 0;
  const overdueTasks = kpis?.overdueTasks || 0;
  const progressPercentage = kpis?.progressPercentage || 0;

  return (
    <div className="space-y-6">
      {/* 1. PROJECT-LEVEL KPIS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Project-Level Execution KPIs
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total Tasks */}
          <Card className="bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3.5 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Tasks</CardTitle>
              <Layers className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
              <div className="text-2xl font-bold text-foreground">{totalTasks}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total scope deliverables</p>
            </CardContent>
          </Card>

          {/* Completed Tasks */}
          <Card className="bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3.5 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
              <div className="text-2xl font-bold text-emerald-600">{completedTasks}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {progressPercentage}% delivered
              </p>
            </CardContent>
          </Card>

          {/* In-Progress Tasks */}
          <Card className="bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3.5 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
              <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active flight work</p>
            </CardContent>
          </Card>

          {/* Overdue Tasks */}
          <Card className="bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3.5 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Overdue</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${overdueTasks > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
              <div className={`text-2xl font-bold ${overdueTasks > 0 ? "text-destructive" : "text-foreground"}`}>
                {overdueTasks}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {overdueTasks > 0 ? "Requires attention" : "All on schedule"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Overall Completion Banner */}
        <Card className="bg-card shadow-sm p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">Project Completion Rate</span>
                <span className="text-muted-foreground">
                  ({completedTasks} of {totalTasks} tasks resolved)
                </span>
              </div>
              <span className="font-bold text-base text-primary">{progressPercentage}%</span>
            </div>

            <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>Todo / Pending: <strong className="text-foreground">{pendingTasks}</strong></span>
              <span>In Flight: <strong className="text-blue-600">{inProgressTasks}</strong></span>
              <span>Delivered: <strong className="text-emerald-600">{completedTasks}</strong></span>
            </div>
          </div>
        </Card>
      </div>

      {/* 2. TEAM-LEVEL KPIS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Assigned Team Execution & Workload Distribution ({teams.length} {teams.length === 1 ? "Team" : "Teams"})
          </h3>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed bg-muted/20">
            <p className="text-xs text-muted-foreground">No team assigned to this project yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {teams.map((t) => (
              <Card key={t._id} className="bg-card shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Shield className="w-4 h-4 text-primary shrink-0" />
                    <h4 className="font-semibold text-sm text-foreground truncate">{t.name}</h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                    {t.workloadDistribution}% of Project
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Team Completion Rate</span>
                    <span className="font-semibold text-foreground">
                      {t.completionPercentage}% ({t.completedTasks}/{t.totalTasks})
                    </span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${t.completionPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[10px]">
                  <div className="bg-muted/40 rounded p-1.5">
                    <span className="text-muted-foreground block">Assigned Tasks</span>
                    <span className="font-bold text-foreground text-xs">{t.totalTasks}</span>
                  </div>
                  <div className="bg-muted/40 rounded p-1.5">
                    <span className="text-muted-foreground block">Completed</span>
                    <span className="font-bold text-emerald-600 text-xs">{t.completedTasks}</span>
                  </div>
                  <div className="bg-muted/40 rounded p-1.5">
                    <span className="text-muted-foreground block">Pending</span>
                    <span className="font-bold text-amber-600 text-xs">{t.pendingTasks}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 3. MEMBER-LEVEL KPIS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Member-Level Performance & Task Output ({members.length} Contributors)
          </h3>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed bg-muted/20">
            <p className="text-xs text-muted-foreground">No members involved in this project yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden divide-y">
            {members.map((m) => {
              const name = m.user?.name || "Unknown Member";
              const initials = getAvatarFallbackText(name);
              const avatarColor = getAvatarColor(name);

              return (
                <div
                  key={m.memberId}
                  className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={m.user?.profilePicture || ""} alt={name} />
                      <AvatarFallback className={`text-xs ${avatarColor}`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{m.user?.email}</p>
                    </div>
                  </div>

                  {/* Task counts and progress */}
                  <div className="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                      <span>Assigned: <strong className="text-foreground">{m.totalAssignedTasks}</strong></span>
                      <span>Done: <strong className="text-emerald-600">{m.completedTasks}</strong></span>
                      {m.overdueTasks > 0 && (
                        <span className="text-destructive font-semibold">⚠️ {m.overdueTasks} Overdue</span>
                      )}
                    </div>

                    <div className="w-full sm:w-36 space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-bold text-primary">{m.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${m.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectKpiDashboard;
