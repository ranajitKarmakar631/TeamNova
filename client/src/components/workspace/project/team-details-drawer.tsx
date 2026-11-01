import { Link } from "react-router-dom";
import {
  ExternalLink,
  Shield,
  Crown,
  Users,
  Briefcase,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectTeamItemType } from "@/types/api.type";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";

interface TeamDetailsDrawerProps {
  team: ProjectTeamItemType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  projectId: string;
}

export const TeamDetailsDrawer = ({
  team,
  open,
  onOpenChange,
  workspaceId,
}: TeamDetailsDrawerProps) => {
  if (!team) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col h-full">
        {/* Header */}
        <div className="p-6 pb-4 border-b space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  <span>{team.name}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {team.status.toLowerCase()}
                  </Badge>
                </SheetTitle>
                {team.slug && (
                  <SheetDescription className="font-mono text-xs">
                    @{team.slug}
                  </SheetDescription>
                )}
              </div>
            </div>

            <Link
              to={`/workspace/${workspaceId}/team/${team._id}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <span>View Full Team</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {team.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {team.description}
            </p>
          )}
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 p-6 space-y-6">
          {/* Team Leadership */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Team Leadership
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Head */}
              <div className="rounded-xl border p-3 flex items-center gap-3 bg-muted/30">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={team.head?.profilePicture || ""} alt={team.head?.name || "Head"} />
                  <AvatarFallback className={getAvatarColor(team.head?.name || "H")}>
                    {getAvatarFallbackText(team.head?.name || "H")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-semibold text-foreground truncate">
                      {team.head?.name || "No Head Assigned"}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground block truncate">
                    Team Head
                  </span>
                </div>
              </div>

              {/* Lead */}
              <div className="rounded-xl border p-3 flex items-center gap-3 bg-muted/30">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={team.lead?.profilePicture || ""} alt={team.lead?.name || "Lead"} />
                  <AvatarFallback className={getAvatarColor(team.lead?.name || "L")}>
                    {getAvatarFallbackText(team.lead?.name || "L")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="text-xs font-semibold text-foreground truncate">
                      {team.lead?.name || "No Lead Assigned"}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground block truncate">
                    Team Lead
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Project-Specific Team KPIs */}
          <div className="space-y-3 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Team Performance in this Project
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl border p-3 bg-card text-center space-y-1">
                <span className="text-[11px] text-muted-foreground block">Assigned Tasks</span>
                <span className="text-lg font-bold text-foreground">{team.totalTasks}</span>
              </div>
              <div className="rounded-xl border p-3 bg-card text-center space-y-1">
                <span className="text-[11px] text-muted-foreground block">Completed</span>
                <span className="text-lg font-bold text-emerald-600">{team.completedTasks}</span>
              </div>
              <div className="rounded-xl border p-3 bg-card text-center space-y-1">
                <span className="text-[11px] text-muted-foreground block">Pending</span>
                <span className="text-lg font-bold text-amber-600">{team.pendingTasks}</span>
              </div>
              <div className="rounded-xl border p-3 bg-card text-center space-y-1">
                <span className="text-[11px] text-muted-foreground block">Completion %</span>
                <span className="text-lg font-bold text-primary">{team.completionPercentage}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Team Progress</span>
                <span className="font-semibold text-foreground">{team.completionPercentage}%</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${team.completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Team Members in Project */}
          <div className="space-y-3 pt-4 pb-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Team Contributors in this Project ({team.members.length})
              </h4>
            </div>

            {team.members.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed bg-muted/20">
                <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-medium text-muted-foreground">
                  No members from this team are assigned to this project yet.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border divide-y overflow-hidden bg-card">
                {team.members.map((m) => {
                  const name = m.user?.name || "Unknown Member";
                  const initials = getAvatarFallbackText(name);
                  const avatarColor = getAvatarColor(name);

                  return (
                    <div
                      key={m.memberId}
                      className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={m.user?.profilePicture || ""} alt={name} />
                          <AvatarFallback className={`text-[10px] ${avatarColor}`}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span>{m.teamRole}</span>
                            {m.projectRole && (
                              <>
                                <span>•</span>
                                <span className="text-primary font-medium">Project {m.projectRole}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                        <Briefcase className="w-3.5 h-3.5 text-primary" />
                        <span className="font-semibold text-foreground">{m.taskCount}</span>
                        <span>tasks</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default TeamDetailsDrawer;
