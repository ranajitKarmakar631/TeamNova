import React, { useState } from "react";
import { TaskType } from "@/types/api.type";
import { TaskPriorityEnum } from "@/constant";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { 
  ArrowDown, 
  AlertTriangle, 
  Copy, 
  Check, 
  Clock,
  MessageSquare 
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";

interface TaskCardProps {
  task: TaskType;
  isDragging?: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: TaskType) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onClick: (task: TaskType) => void;
}

// Deterministic tag color styling
const getTagColorClass = (tag: string) => {
  const lower = tag.toLowerCase();
  if (lower.includes("front") || lower.includes("ui") || lower.includes("web")) {
    return "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50";
  }
  if (lower.includes("design") || lower.includes("ux")) {
    return "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50";
  }
  if (lower.includes("mobile") || lower.includes("ios") || lower.includes("android")) {
    return "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50";
  }
  if (lower.includes("infra") || lower.includes("devops") || lower.includes("cloud")) {
    return "bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
  if (lower.includes("api") || lower.includes("back") || lower.includes("server")) {
    return "bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50";
  }
  return "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50";
};

// Deterministic project dot color
const getProjectDotColor = (projectName?: string) => {
  if (!projectName) return "bg-slate-400";
  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < projectName.length; i++) {
    hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onClick,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.taskCode) {
      navigator.clipboard.writeText(task.taskCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const assignees = Array.isArray(task.assignedTo)
    ? task.assignedTo
    : task.assignedTo
    ? [task.assignedTo]
    : [];

  // Due date status
  let dueDateText: string | null = null;
  let isOverdue = false;
  let isDueToday = false;

  if (task.dueDate) {
    const due = new Date(task.dueDate);
    if (!isNaN(due.getTime())) {
      isDueToday = isToday(due);
      isOverdue = isPast(due) && !isDueToday && task.status !== "DONE";
      dueDateText = isDueToday ? "Today" : format(due, "MMM dd");
    }
  }

  // Tag: prefer team name, or fallback if available
  const tag = task.team?.name || (task.project?.name ? "core" : undefined);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task)}
      className={`group relative bg-card text-card-foreground border border-border/70 rounded-xl p-3.5 shadow-xs select-none cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 ${
        isDragging ? "opacity-30 scale-95 border-dashed border-primary" : "opacity-100"
      }`}
    >
      {/* Top row: Task code + Copy + Tag */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors tracking-tight">
            {task.taskCode || `TASK-${task._id.slice(-4).toUpperCase()}`}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy task code"
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity p-0.5 rounded hover:bg-muted"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>

        {tag && (
          <span
            className={`text-[10px] font-medium tracking-tight px-1.5 py-0.5 rounded-md border ${getTagColorClass(
              tag
            )}`}
          >
            {tag.toLowerCase()}
          </span>
        )}
      </div>

      {/* Middle row: Title */}
      <h4 className="text-[13px] font-medium leading-snug text-foreground/95 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
        {task.title}
      </h4>

      {/* Project name indicator */}
      {task.project?.name && (
        <div className="flex items-center gap-1.5 mb-3 text-[11px] text-muted-foreground">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${getProjectDotColor(
              task.project.name
            )}`}
          />
          <span className="truncate">{task.project.name}</span>
        </div>
      )}

      {/* Bottom row: Priority, Due Date/Subtasks, Assignee */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority pill */}
          {task.priority === TaskPriorityEnum.LOW && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <ArrowDown className="w-3.5 h-3.5" />
              Low
            </span>
          )}
          {task.priority === TaskPriorityEnum.MEDIUM && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              <span className="text-sm leading-none font-bold">=</span>
              Medium
            </span>
          )}
          {task.priority === TaskPriorityEnum.HIGH && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              High
            </span>
          )}

          {/* Due date / Overdue badge */}
          {isOverdue && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 px-1.5 py-0.5 rounded-md">
              <Clock className="w-2.5 h-2.5" />
              Overdue
            </span>
          )}
          {!isOverdue && dueDateText && (
            <span className="text-[11px] text-muted-foreground font-medium">
              {dueDateText}
            </span>
          )}

          {(task.commentCount ?? 0) > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 hover:text-foreground font-medium"
              title={`${task.commentCount} comments`}
            >
              <MessageSquare className="w-3 h-3" />
              {task.commentCount}
            </span>
          )}
        </div>

        {/* Assignees & Reporter */}
        <div className="flex items-center gap-1.5 shrink-0">
          {task.reportedTo && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border">
                    <span>Rep:</span>
                    <span className="font-medium truncate max-w-[50px]">{task.reportedTo.name}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Reported to: {task.reportedTo.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center -space-x-1.5 shrink-0 cursor-default">
                  {assignees.length === 0 ? (
                    <Avatar className="h-6 w-6 ring-1 ring-border/50 text-[10px]">
                      <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                        ?
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    assignees.slice(0, 3).map((a, i) => {
                      const name = a.name || "";
                      const initials = getAvatarFallbackText(name);
                      const bg = getAvatarColor(name);
                      return (
                        <Avatar key={a._id || i} className="h-6 w-6 ring-1 ring-background text-[10px]">
                          {a.profilePicture && (
                            <AvatarImage src={a.profilePicture} alt={name} />
                          )}
                          <AvatarFallback className={`${bg} text-white font-medium`}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })
                  )}
                  {assignees.length > 3 && (
                    <span className="text-[10px] pl-1 font-semibold text-muted-foreground">
                      +{assignees.length - 3}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  {assignees.length > 0
                    ? assignees.map((a) => a.name).join(", ")
                    : "Unassigned"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
