import { useState } from "react";
import { Row } from "@tanstack/react-table";
import { MoreHorizontal, ExternalLink, Copy, Trash2, Pencil } from "lucide-react";
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
import { ProjectType } from "@/types/api.type";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { deleteProjectMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import EditProjectDialog from "../edit-project-dialog";

interface ProjectTableRowActionsProps {
  row: Row<ProjectType>;
}

export function ProjectTableRowActions({ row }: ProjectTableRowActionsProps) {
  const [openDeleteDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const project = row.original;
  const projectId = project._id;

  const { mutate, isPending } = useMutation({
    mutationFn: deleteProjectMutationFn,
  });

  const handleCopyLink = () => {
    const url = `${window.location.origin}/workspace/${workspaceId}/project/${projectId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Project URL copied to clipboard",
      variant: "success",
    });
  };

  const handleConfirmDelete = () => {
    mutate(
      { workspaceId, projectId },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({
            queryKey: ["allprojects", workspaceId],
          });
          toast({
            title: "Success",
            description: data?.message || "Project deleted successfully",
            variant: "success",
          });
          setOpenDialog(false);
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error?.message || "Failed to delete project",
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
            onClick={() => navigate(`/workspace/${workspaceId}/project/${projectId}`)}
          >
            <ExternalLink className="w-4 h-4 mr-2" /> View Details
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setOpenEditDialog(true)}
          >
            <Pencil className="w-4 h-4 mr-2" /> Edit Project
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer" onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" /> Copy Link
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="!text-destructive cursor-pointer"
            onClick={() => setOpenDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Project Dialog */}
      <EditProjectDialog
        project={project}
        isOpen={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={openDeleteDialog}
        isLoading={isPending}
        onClose={() => setOpenDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        description={`Are you sure you want to delete "${project.name}"? All associated tasks will be removed permanently.`}
        confirmText="Delete Project"
        cancelText="Cancel"
      />
    </>
  );
}
