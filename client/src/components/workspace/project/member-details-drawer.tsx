import { useState } from "react";
import { format } from "date-fns";
import {
  Crown,
  FileText,
  Loader,
  Mail,
  Shield,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectMemberTasksQuery, ProjectMemberItemType } from "@/features/project";
import { TaskType } from "@/features/task";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import EditTaskDialog from "../task/edit-task-dialog";

interface MemberDetailsDrawerProps {
  member: ProjectMemberItemType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  projectId: string;
}

export const MemberDetailsDrawer = ({
  member,
  open,
  onOpenChange,
  workspaceId,
  projectId,
}: MemberDetailsDrawerProps) => {
  const [taskToEdit, setTaskToEdit] = useState<TaskType | null>(null);

  const userId = member?.user?._id;

  const { data, isLoading } = useProjectMemberTasksQuery({
    workspaceId,
    projectId,
    userId: userId || "",
  });

  if (!member) return null;

  const name = member.user?.name || "Unknown Member";
  const email = member.user?.email || "";
  const initials = getAvatarFallbackText(name);
  const avatarColor = getAvatarColor(name);
  const tasks = data?.tasks || [];
  const kpis = data?.kpis || {
    totalTasks: member.totalAssignedTasks,
    completedTasks: member.completedTasks,
    inProgressTasks: member.inProgressTasks,
    pendingTasks: member.pendingTasks,
    overdueTasks: member.overdueTasks,
    completionPercentage: member.completionPercentage,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col h-full">
        {/* Header */}
        <div className="p-6 pb-4 border-b space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 shrink-0 shadow">
              <AvatarImage src={member.user?.profilePicture || ""} alt={name} />
              <AvatarFallback className={`text-base font-semibold ${avatarColor}`}>
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-xl font-bold text-foreground">
                  {name}
                </SheetTitle>
                <Badge
                  variant="outline"
                  className={
                    member.projectRole === "HEAD"
                      ? "border-amber-500/30 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20"
                      : member.projectRole === "LEAD"
                      ? "border-indigo-500/30 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20"
                      : "border-slate-300 text-slate-600"
                  }
                >
                  {member.projectRole === "HEAD" && <Crown className="w-3 h-3 mr-1" />}
                  {member.projectRole === "LEAD" && <Shield className="w-3 h-3 mr-1" />}
                  {member.projectRole}
                </Badge>
              </div>

              {email && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{email}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1.5">
                <span className="capitalize">Workspace {member.workspaceRole}</span>
                {member.joinedAt && (
                  <>
                    <span>•</span>
                    <span>Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Associated Teams */}
          {member.teams && member.teams.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground mr-1">Teams:</span>
              {member.teams.map((t) => (
                <Badge key={t._id} variant="secondary" className="text-[11px] font-normal gap-1">
                  <Shield className="w-3 h-3 text-primary" />
                  <span>{t.name}</span>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 p-6 space-y-6">
          {/* Member KPIs in Project */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Member Project Metrics
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="rounded-xl border p-3 bg-card text-center space-y-1">
                <span className="text-[11px] text-muted-foreground block">Assigned Tasks</span>
                <span className="text-lg font-bold text-foreground">{kpis.totalTasks}</span>
              </div>
              <div className="rounded-xl border p-3 bg-card text-center space-y-1">
                <span className="text-[11px] text-muted-foreground block">Completed</span>
                <span className="text-lg font-bold text-emerald-600">{kpis.completedTasks}</span>
              </div>
              <div className="rounded-xl border p-3 bg-card text-center space-y-1">
                <span className="text-[11px] text-muted-foreground block">In Progress</span>
                <span className="text-lg font-bold text-blue-600">{kpis.inProgressTasks}</span>
              </div>
              <div className="rounded-xl border p-3 bg-card text-center space-y-1">
                <span className="text-[11px] text-muted-foreground block">Pending / Todo</span>
                <span className="text-lg font-bold text-amber-600">{kpis.pendingTasks}</span>
              </div>
              <div className="rounded-xl border p-3 bg-card text-center space-y-1">
                <span className="text-[11px] text-muted-foreground block">Overdue</span>
                <span className={`text-lg font-bold ${kpis.overdueTasks > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {kpis.overdueTasks}
                </span>
              </div>
              <div className="rounded-xl border p-3 bg-card text-center space-y-1">
                <span className="text-[11px] text-muted-foreground block">Completion %</span>
                <span className="text-lg font-bold text-primary">{kpis.completionPercentage}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Task Completion Progress</span>
                <span className="font-semibold text-foreground">{kpis.completionPercentage}%</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${kpis.completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Member Tasks List */}
          <div className="space-y-3 pt-4 pb-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assigned Tasks in this Project ({tasks.length})
              </h4>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed bg-muted/20">
                <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-medium text-muted-foreground">
                  No tasks assigned to this member in this project yet.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border divide-y overflow-hidden bg-card">
                {tasks.map((task) => {
                  const isDone = task.status === "DONE";
                  const isOverdue =
                    !isDone && task.dueDate && new Date(task.dueDate) < new Date();

                  return (
                    <div
                      key={task._id}
                      className="p-3.5 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                      onClick={() => setTaskToEdit(task)}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                            {task.taskCode}
                          </Badge>
                          <span className={`text-xs font-medium text-foreground truncate max-w-[260px] ${isDone ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {task.dueDate && (
                            <span className={isOverdue ? "text-destructive font-semibold" : ""}>
                              Due {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </span>
                          )}
                          {task.description && (
                            <span className="truncate max-w-[200px]">
                              • {task.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={
                            task.status === "DONE"
                              ? "border-emerald-500/30 text-emerald-600 bg-emerald-50/50 text-[10px]"
                              : task.status === "IN_PROGRESS"
                              ? "border-blue-500/30 text-blue-600 bg-blue-50/50 text-[10px]"
                              : "border-slate-300 text-[10px]"
                          }
                        >
                          {task.status.replace("_", " ").toLowerCase()}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {task.priority.toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Task Edit Dialog */}
        {taskToEdit && (
          <EditTaskDialog
            task={taskToEdit}
            isOpen={Boolean(taskToEdit)}
            onClose={() => setTaskToEdit(null)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MemberDetailsDrawer;
