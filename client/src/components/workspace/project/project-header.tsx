/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Copy,
  Crown,
  Loader,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/resuable/confirm-dialog";
import PermissionsGuard from "@/components/resuable/permission-guard";
import { Permissions } from "@/constant";
import { useAuthContext } from "@/context/auth-provider";
import { toast } from "@/hooks/use-toast";
import useWorkspaceId from "@/hooks/use-workspace-id";
import {
  deleteProjectMutationFn,
  getProjectOverviewQueryFn,
} from "@/lib/api";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import CreateTaskDialog from "../task/create-task-dialog";
import EditProjectDialog from "./edit-project-dialog";

export const ProjectHeader = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthContext();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const canDeleteProject = hasPermission(Permissions.DELETE_PROJECT);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["project-overview", projectId],
    queryFn: () =>
      getProjectOverviewQueryFn({
        workspaceId,
        projectId: projectId!,
      }),
    enabled: Boolean(workspaceId && projectId),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProjectMutationFn,
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["allprojects", workspaceId],
      });
      toast({
        title: "Success",
        description: res.message || "Project deleted successfully",
        variant: "success",
      });
      navigate(`/workspace/${workspaceId}/projects`);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  const project = data?.project;
  const head = data?.head;
  const kpis = data?.kpis;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Project URL copied to clipboard",
      variant: "success",
    });
  };

  const handleDeleteProject = () => {
    if (!projectId) return;
    deleteMutation.mutate({ workspaceId, projectId });
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border bg-card p-6">
        <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Project Not Found</h2>
        <p className="text-sm text-muted-foreground">
          This project may have been deleted or moved.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate(`/workspace/${workspaceId}/projects`)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Button>
      </div>
    );
  }

  const projectEmoji = project.emoji || "📊";
  const projectName = project.name || "Untitled Project";
  const headName = head?.user?.name || "Unassigned";
  const headInitials = getAvatarFallbackText(headName);
  const headColor = getAvatarColor(headName);

  const team = (project as any).team;
  const rawTeams = (project as any).teams;
  const assignedTeams: any[] = [];
  if (Array.isArray(rawTeams) && rawTeams.length > 0) {
    rawTeams.forEach((t: any) => {
      if (t && typeof t === "object" && !assignedTeams.some((ex) => ex._id === t._id)) {
        assignedTeams.push(t);
      }
    });
  }
  if (team && typeof team === "object" && !assignedTeams.some((ex) => ex._id === team._id)) {
    assignedTeams.push(team);
  }

  const progress = kpis?.progressPercentage || 0;

  return (
    <div className="space-y-4">
      {/* Back navigation */}
      <div>
        <Link
          to={`/workspace/${workspaceId}/projects`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Main Project Header Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Title and badges */}
          <div className="flex items-start sm:items-center gap-3.5">
            <span className="text-3xl p-2 rounded-xl bg-muted/70 flex items-center justify-center shrink-0 shadow-inner">
              {projectEmoji}
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {projectName}
                </h1>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs font-medium"
                >
                  Active
                </Badge>
                {assignedTeams.map((t) => (
                  <Link key={t._id} to={`/workspace/${workspaceId}/team/${t._id}`}>
                    <Badge
                      variant="secondary"
                      className="gap-1 text-xs hover:bg-secondary/80 transition-colors cursor-pointer"
                    >
                      <Shield className="w-3 h-3 text-primary" />
                      <span>{t.name}</span>
                    </Badge>
                  </Link>
                ))}
              </div>

              {/* Head / Lead info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Project Head:</span>
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={head?.user?.profilePicture || ""} alt={headName} />
                    <AvatarFallback className={`text-[8px] ${headColor}`}>
                      {headInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span>{headName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5 text-xs h-9"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Share</span>
            </Button>

            <PermissionsGuard requiredPermission={Permissions.EDIT_PROJECT}>
              <EditProjectDialog project={project} />
            </PermissionsGuard>

            {canDeleteProject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive hover:bg-destructive/10 text-xs h-9"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}

            <CreateTaskDialog projectId={projectId} />
          </div>
        </div>

        {/* Project Description */}
        {project.description && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-4xl">
            {project.description}
          </p>
        )}

        {/* Progress Bar & KPI Summary Strip */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Project Progress</span>
              <span className="text-muted-foreground">
                ({kpis?.completedTasks || 0} of {kpis?.totalTasks || 0} tasks completed)
              </span>
            </div>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Metadata Footer bar */}
        <div className="flex flex-wrap items-center gap-5 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-foreground">{kpis?.totalMembers || 0}</span>
            <span>project members</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-medium text-foreground">{kpis?.totalTeams || 0}</span>
            <span>assigned {kpis?.totalTeams === 1 ? "team" : "teams"}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium text-foreground">{kpis?.completedTasks || 0}</span>
            <span>completed</span>
          </div>

          {(kpis?.overdueTasks || 0) > 0 && (
            <div className="flex items-center gap-1.5 text-destructive font-medium">
              <span>⚠️ {kpis?.overdueTasks} overdue</span>
            </div>
          )}

          {project.createdAt && (
            <div className="flex items-center gap-1.5 ml-auto">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created {format(new Date(project.createdAt), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        isLoading={deleteMutation.isPending}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        description={`Are you sure you want to delete "${projectName}"? All tasks and associations under this project will be permanently deleted.`}
        confirmText="Delete Project"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ProjectHeader;
