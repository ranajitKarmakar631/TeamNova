import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Crown,
  Users,
  ArrowRight,
  Loader,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PermissionsGuard from "@/components/resuable/permission-guard";
import { ConfirmDialog } from "@/components/resuable/confirm-dialog";
import { Permissions } from "@/constant";
import { toast } from "@/hooks/use-toast";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getProjectTeamsQueryFn, removeTeamFromProjectMutationFn } from "@/lib/api";
import { ProjectTeamItemType } from "@/types/api.type";
import TeamDetailsDrawer from "./team-details-drawer";
import AssignTeamDialog from "./assign-team-dialog";

export const ProjectTeams = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const [selectedTeam, setSelectedTeam] = useState<ProjectTeamItemType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [teamToRemove, setTeamToRemove] = useState<ProjectTeamItemType | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["project-teams", projectId],
    queryFn: () =>
      getProjectTeamsQueryFn({
        workspaceId,
        projectId: projectId!,
      }),
    enabled: Boolean(workspaceId && projectId),
  });

  const teams = data?.teams || [];

  const removeMutation = useMutation({
    mutationFn: removeTeamFromProjectMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-teams", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-overview", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-members", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["available-scope-members"],
      });
      queryClient.invalidateQueries({
        queryKey: ["allprojects", workspaceId],
      });
      toast({
        title: "Success",
        description: "Team removed from project successfully",
        variant: "success",
      });
      setTeamToRemove(null);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to remove team from project",
        variant: "destructive",
      });
    },
  });

  const handleOpenTeam = (team: ProjectTeamItemType) => {
    setSelectedTeam(team);
    setIsDrawerOpen(true);
  };

  const handleConfirmRemove = () => {
    if (!teamToRemove || !projectId) return;
    removeMutation.mutate({
      workspaceId,
      projectId,
      teamId: teamToRemove._id,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 rounded-xl border border-destructive/20 bg-destructive/5 space-y-2">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
        <p className="text-sm font-semibold text-destructive">Failed to load project teams</p>
        <p className="text-xs text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-2xl border border-dashed bg-muted/20 space-y-3">
        <Shield className="w-12 h-12 text-muted-foreground/40 mx-auto" />
        <h3 className="text-base font-semibold text-foreground">No Teams Assigned Yet</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Assign one or more teams to this project to organize squad collaboration and track team deliverables.
        </p>
        <PermissionsGuard requiredPermission={Permissions.EDIT_PROJECT}>
          <Button
            size="sm"
            onClick={() => setIsAssignDialogOpen(true)}
            className="gap-1.5 text-xs h-9 mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Team</span>
          </Button>
        </PermissionsGuard>

        <AssignTeamDialog
          isOpen={isAssignDialogOpen}
          onClose={() => setIsAssignDialogOpen(false)}
          projectId={projectId!}
          currentTeamIds={[]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Project Teams ({teams.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Teams collaborating to deliver this project. Click any team to view breakdown, member roles, and task distribution.
          </p>
        </div>

        <PermissionsGuard requiredPermission={Permissions.EDIT_PROJECT}>
          <Button
            size="sm"
            onClick={() => setIsAssignDialogOpen(true)}
            className="gap-1.5 text-xs h-9 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Team</span>
          </Button>
        </PermissionsGuard>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((team) => {
          const headName = team.head?.name || "Unassigned";
          const leadName = team.lead?.name || "Unassigned";

          return (
            <Card
              key={team._id}
              className="hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow group overflow-hidden bg-card"
              onClick={() => handleOpenTeam(team)}
            >
              <CardHeader className="p-5 pb-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {team.name}
                        </h4>
                        <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                          {team.status.toLowerCase()}
                        </Badge>
                      </div>
                      {team.slug && (
                        <span className="text-[11px] text-muted-foreground font-mono truncate block">
                          @{team.slug}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <PermissionsGuard requiredPermission={Permissions.EDIT_PROJECT}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTeamToRemove(team);
                        }}
                        title="Remove team from project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </PermissionsGuard>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground group-hover:text-foreground"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {team.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {team.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                {/* Team Leadership Pill */}
                <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-muted-foreground text-[11px]">Head:</span>
                    <span className="font-medium text-foreground truncate max-w-[110px] text-[11px]">
                      {headName}
                    </span>
                  </div>

                  {team.lead && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="text-muted-foreground text-[11px]">Lead:</span>
                      <span className="font-medium text-foreground truncate max-w-[110px] text-[11px]">
                        {leadName}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 ml-auto text-[11px] text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{team.totalMembers} members</span>
                  </div>
                </div>

                {/* Progress Bar & Task Stats */}
                <div className="space-y-2 pt-2 bg-muted/30 p-3 rounded-xl border border-muted/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium text-[11px]">
                      Team Project Execution
                    </span>
                    <span className="font-bold text-primary text-[11px]">
                      {team.completionPercentage}% ({team.completedTasks}/{team.totalTasks} Tasks)
                    </span>
                  </div>

                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${team.completionPercentage}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[10px]">
                    <div className="bg-background rounded p-1">
                      <span className="text-muted-foreground block">Assigned</span>
                      <span className="font-bold text-foreground text-xs">{team.totalTasks}</span>
                    </div>
                    <div className="bg-background rounded p-1">
                      <span className="text-muted-foreground block">Completed</span>
                      <span className="font-bold text-emerald-600 text-xs">{team.completedTasks}</span>
                    </div>
                    <div className="bg-background rounded p-1">
                      <span className="text-muted-foreground block">Pending</span>
                      <span className="font-bold text-amber-600 text-xs">{team.pendingTasks}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assign Team Dialog */}
      <AssignTeamDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        projectId={projectId!}
        currentTeamIds={teams.map((t) => t._id)}
      />

      {/* Confirm Team Removal Dialog */}
      <ConfirmDialog
        isOpen={Boolean(teamToRemove)}
        isLoading={removeMutation.isPending}
        onClose={() => setTeamToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Team from Project"
        description={`Are you sure you want to remove team "${teamToRemove?.name}" from this project? Tasks assigned to members will remain in the project.`}
        confirmText="Remove Team"
        cancelText="Cancel"
      />

      {/* Team Details Drawer */}
      <TeamDetailsDrawer
        team={selectedTeam}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        workspaceId={workspaceId}
        projectId={projectId!}
      />
    </div>
  );
};

export default ProjectTeams;
