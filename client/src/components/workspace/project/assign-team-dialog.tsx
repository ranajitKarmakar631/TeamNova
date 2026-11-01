import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader, Plus, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { assignTeamsToProjectMutationFn, getAllTeamsQueryFn } from "@/lib/api";

interface AssignTeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentTeamIds: string[];
}

export const AssignTeamDialog = ({
  isOpen,
  onClose,
  projectId,
  currentTeamIds,
}: AssignTeamDialogProps) => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["allteams", workspaceId],
    queryFn: () => getAllTeamsQueryFn({ workspaceId, pageSize: 100 }),
    enabled: isOpen && Boolean(workspaceId),
  });

  const allTeams = data?.teams || [];
  // Filter out teams that are already assigned to this project
  const availableTeams = allTeams.filter((t) => !currentTeamIds.includes(t._id));

  const assignMutation = useMutation({
    mutationFn: assignTeamsToProjectMutationFn,
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
        description: "Team(s) assigned to project successfully",
        variant: "success",
      });
      setSelectedTeamIds([]);
      onClose();
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to assign teams to project",
        variant: "destructive",
      });
    },
  });

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const handleAssign = () => {
    if (selectedTeamIds.length === 0) return;
    assignMutation.mutate({
      workspaceId,
      projectId,
      teamIds: selectedTeamIds,
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedTeamIds([]);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Shield className="w-5 h-5 text-primary" />
            <span>Assign Teams to Project</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select one or more teams to collaborate on this project.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : availableTeams.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed bg-muted/20 space-y-2">
            <Shield className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <p className="text-xs font-medium text-foreground">
              {allTeams.length === 0
                ? "No teams found in this workspace."
                : "All workspace teams are already assigned to this project."}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px] pr-2">
            <div className="space-y-2">
              {availableTeams.map((team) => {
                const isSelected = selectedTeamIds.includes(team._id);

                return (
                  <div
                    key={team._id}
                    onClick={() => toggleTeam(team._id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/40 bg-background"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {team.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] capitalize py-0 px-1.5">
                            {team.status.toLowerCase()}
                          </Badge>
                        </div>
                        {team.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                            {team.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={assignMutation.isPending}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleAssign}
            disabled={selectedTeamIds.length === 0 || assignMutation.isPending}
            className="text-xs gap-1.5"
          >
            {assignMutation.isPending ? (
              <Loader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>
              Assign {selectedTeamIds.length > 0 ? `(${selectedTeamIds.length})` : ""}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTeamDialog;

