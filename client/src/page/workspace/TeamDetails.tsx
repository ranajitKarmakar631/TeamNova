import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  ArrowLeft,
  Copy,
  Pencil,
  Trash2,
  Loader,
  Calendar,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/resuable/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getTeamByIdQueryFn, deleteTeamMutationFn } from "@/lib/api";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { format } from "date-fns";
import { useAuthContext } from "@/context/auth-provider";
import { Permissions } from "@/constant";
import ScopeMembersList from "@/components/workspace/association/scope-members-list";
import EditTeamDialog from "@/components/workspace/team/edit-team-dialog";

export const TeamDetails = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthContext();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const canEditTeam = hasPermission(Permissions.TEAM_UPDATE);
  const canDeleteTeam = hasPermission(Permissions.TEAM_DELETE);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["team-detail", teamId],
    queryFn: () => getTeamByIdQueryFn({ workspaceId, teamId: teamId! }),
    enabled: Boolean(workspaceId && teamId),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeamMutationFn,
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["all-teams", workspaceId],
      });
      toast({
        title: "Success",
        description: res.message || "Team deleted successfully",
        variant: "success",
      });
      navigate(`/workspace/${workspaceId}/teams`);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete team",
        variant: "destructive",
      });
    },
  });

  const team = data?.team;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Team URL copied to clipboard",
      variant: "success",
    });
  };

  const handleDeleteTeam = () => {
    if (!teamId) return;
    deleteMutation.mutate({ workspaceId, teamId });
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className="py-12 text-center space-y-4">
        <h2 className="text-xl font-semibold">Team not found</h2>
        <p className="text-muted-foreground text-sm">
          This team might have been deleted or moved.
        </p>
        <Button variant="outline" onClick={() => navigate(`/workspace/${workspaceId}/teams`)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Teams
        </Button>
      </div>
    );
  }

  const creatorName = team.createdBy?.name || "Unknown";
  const creatorInitials = getAvatarFallbackText(creatorName);
  const creatorColor = getAvatarColor(creatorName);

  return (
    <div className="w-full space-y-6 py-4 md:pt-3">
      {/* Back navigation */}
      <div>
        <Link
          to={`/workspace/${workspaceId}/teams`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Teams</span>
        </Link>
      </div>

      {/* Team Header Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {team.name}
                </h1>
                {team.status && (
                  <Badge
                    variant={team.status === "ACTIVE" ? "default" : "secondary"}
                    className="text-xs capitalize font-medium"
                  >
                    {team.status.toLowerCase()}
                  </Badge>
                )}
              </div>
              {team.slug && (
                <span className="text-xs text-muted-foreground font-mono">
                  @{team.slug}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5">
              <Copy className="w-3.5 h-3.5" />
              <span>Share</span>
            </Button>

            {canEditTeam && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Button>
            )}

            {canDeleteTeam && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {team.description && (
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            {team.description}
          </p>
        )}

        {/* Metadata bar */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{team.membersCount || 0} members</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Created by</span>
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={team.createdBy?.profilePicture || ""} alt={creatorName} />
                <AvatarFallback className={`text-[9px] ${creatorColor}`}>
                  {creatorInitials}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{creatorName}</span>
            </div>
          </div>

          {team.createdAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created on {format(new Date(team.createdAt), "MMMM d, yyyy")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Scope Members Section */}
      <ScopeMembersList
        scopeType="TEAM"
        scopeId={teamId!}
        scopeTitle={team.name}
      />

      {/* Edit Dialog */}
      <EditTeamDialog
        team={team}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        isLoading={deleteMutation.isPending}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteTeam}
        title="Delete Team"
        description={`Are you sure you want to delete "${team.name}"? All associations with this team will be permanently removed.`}
        confirmText="Delete Team"
        cancelText="Cancel"
      />
    </div>
  );
};

export default TeamDetails;
