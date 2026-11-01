import { useState } from "react";
import { Row } from "@tanstack/react-table";
import { MoreHorizontal, ExternalLink, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/resuable/confirm-dialog";
import { TeamType } from "@/types/api.type";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { deleteTeamMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/auth-provider";
import { Permissions } from "@/constant";

interface TeamTableRowActionsProps {
  row: Row<TeamType>;
}

export function TeamTableRowActions({ row }: TeamTableRowActionsProps) {
  const { hasPermission } = useAuthContext();
  const [openDeleteDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const team = row.original;
  const teamId = team._id;
  const canDeleteTeam = hasPermission(Permissions.TEAM_DELETE);

  const { mutate, isPending } = useMutation({
    mutationFn: deleteTeamMutationFn,
  });

  const handleCopyLink = () => {
    const url = `${window.location.origin}/workspace/${workspaceId}/team/${teamId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Team URL copied to clipboard",
      variant: "success",
    });
  };

  const handleConfirmDelete = () => {
    mutate(
      { workspaceId, teamId },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ["all-teams", workspaceId] });
          toast({
            title: "Success",
            description: data.message || "Team deleted successfully",
            variant: "success",
          });
          setOpenDialog(false);
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error?.message || "Failed to delete team",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[170px]">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => navigate(`/workspace/${workspaceId}/team/${teamId}`)}
          >
            <ExternalLink className="w-4 h-4 mr-2" /> View Details
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer" onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" /> Copy Link
          </DropdownMenuItem>

          {canDeleteTeam && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="!text-destructive cursor-pointer"
                onClick={() => setOpenDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Team
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        isOpen={openDeleteDialog}
        isLoading={isPending}
        onClose={() => setOpenDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Team"
        description={`Are you sure you want to delete "${team.name}"? All associations with this team will be removed.`}
        confirmText="Delete Team"
        cancelText="Cancel"
      />
    </>
  );
}
