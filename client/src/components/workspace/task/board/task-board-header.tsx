import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Columns3, 
  List, 
  Calendar as CalendarIcon, 
  Plus
} from "lucide-react";
import CreateTaskDialog from "../create-task-dialog";

interface TaskBoardHeaderProps {
  view: "board" | "list" | "calendar";
  onViewChange: (view: "board" | "list" | "calendar") => void;
  columnCount?: number;
  totalTasks?: number;
  completedTasks?: number;
  projectId?: string;
  canCreateTask?: boolean;
}

export const TaskBoardHeader: React.FC<TaskBoardHeaderProps> = ({
  view,
  onViewChange,
  columnCount = 5,
  totalTasks = 0,
  completedTasks = 0,
  projectId,
  canCreateTask = true,
}) => {
  const remaining = Math.max(0, totalTasks - completedTasks);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-2 pt-1 border-b border-border/40">
      {/* Left: Sprint / Task status pill, Column count, New Task */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Sprint status chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/50 text-xs font-medium text-foreground select-none">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Sprint ends in 4 days</span>
          <span className="text-border">|</span>
          <span className="text-muted-foreground">
            {remaining > 0 ? `${remaining * 2} pts remaining` : "All caught up"}
          </span>
        </div>

        {/* Columns count chip */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/50 text-xs font-semibold text-muted-foreground select-none">
          <Columns3 className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Columns ({columnCount})</span>
        </div>

        {/* New Task button */}
        {canCreateTask && (
          <CreateTaskDialog
            projectId={projectId}
            trigger={
              <Button className="h-8 px-3 rounded-xl gap-1.5 font-semibold text-xs shadow-xs">
                <Plus className="w-3.5 h-3.5" />
                New Task
              </Button>
            }
          />
        )}
      </div>

      {/* Right: View switcher (List / Board / Calendar) */}
      <div className="inline-flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60">
        <button
          type="button"
          onClick={() => onViewChange("list")}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            view === "list"
              ? "bg-card text-foreground shadow-xs border border-border/50"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>List</span>
        </button>

        <button
          type="button"
          onClick={() => onViewChange("board")}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            view === "board"
              ? "bg-card text-foreground shadow-xs border border-border/50"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Columns3 className="w-3.5 h-3.5" />
          <span>Board</span>
        </button>

        <button
          type="button"
          onClick={() => onViewChange("calendar")}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            view === "calendar"
              ? "bg-card text-foreground shadow-xs border border-border/50"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Calendar</span>
        </button>
      </div>
    </div>
  );
};

