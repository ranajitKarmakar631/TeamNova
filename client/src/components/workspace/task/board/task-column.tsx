import React from "react";
import { TaskType } from "@/features/task";
import { TaskStatusEnumType } from "@/constant";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, ArrowDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ColumnDefinition {
  id: TaskStatusEnumType;
  title: string;
  dotClass: string;
  wipLimit?: number;
}

interface TaskColumnProps {
  column: ColumnDefinition;
  tasks: TaskType[];
  draggedTask: TaskType | null;
  isOver: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: TaskType) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, status: TaskStatusEnumType) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: TaskStatusEnumType) => void;
  onCardClick: (task: TaskType) => void;
  onQuickAdd: (status: TaskStatusEnumType) => void;
  canCreateTask?: boolean;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({
  column,
  tasks,
  draggedTask,
  isOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardClick,
  onQuickAdd,
  canCreateTask = true,
}) => {
  const isDraggingFromOther =
    isOver && draggedTask && draggedTask.status !== column.id;

  return (
    <div
      onDragOver={(e) => onDragOver(e, column.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, column.id)}
      className={`flex flex-col min-w-[280px] w-full max-w-[340px] bg-muted/40 dark:bg-muted/20 border border-border/50 rounded-2xl p-2.5 transition-colors duration-150 ${
        isOver
          ? "ring-2 ring-primary/40 bg-primary/[0.03]"
          : "hover:border-border/80"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-2 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${column.dotClass}`} />
          <h3 className="font-bold text-xs uppercase tracking-wider text-foreground truncate">
            {column.title}
          </h3>
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border/40 shrink-0">
            {column.wipLimit
              ? `${tasks.length} / ${column.wipLimit} WIP`
              : tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {canCreateTask && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={() => onQuickAdd(column.id)}
              title={`Add task to ${column.title}`}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 text-xs">
              <DropdownMenuItem onClick={() => onQuickAdd(column.id)}>
                <Plus className="w-3.5 h-3.5 mr-2" />
                Add card
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                Column settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards Scroll Area */}
      <div className="flex-1 min-h-[320px] max-h-[calc(100vh-280px)] overflow-y-auto space-y-2.5 px-0.5 py-1">
        {/* Render Drop indicator at the top if target column is empty or dragged from another column */}
        {isDraggingFromOther && tasks.length === 0 && (
          <div className="border-2 border-dashed border-primary/60 bg-primary/5 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-primary text-xs font-semibold my-1 transition-all animate-in fade-in zoom-in-95 duration-150">
            <ArrowDown className="w-4 h-4 animate-bounce" />
            <span>Drop card here to move to {column.title}</span>
          </div>
        )}

        {tasks.map((task) => (
          <React.Fragment key={task._id}>
            <TaskCard
              task={task}
              isDragging={draggedTask?._id === task._id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onClick={onCardClick}
            />
          </React.Fragment>
        ))}

        {/* Drop target indicator inside column with existing cards */}
        {isDraggingFromOther && tasks.length > 0 && (
          <div className="border-2 border-dashed border-primary/60 bg-primary/5 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-primary text-xs font-semibold my-1.5 transition-all animate-in fade-in zoom-in-95 duration-150">
            <ArrowDown className="w-4 h-4 animate-bounce" />
            <span>Drop card here to move to {column.title}</span>
          </div>
        )}

        {/* Empty placeholder if no cards and not dragging */}
        {tasks.length === 0 && !isDraggingFromOther && (
          <div className="h-28 flex flex-col items-center justify-center text-center p-3 rounded-xl border border-dashed border-border/50 text-muted-foreground/60 text-xs">
            <span>No tasks in {column.title.toLowerCase()}</span>
          </div>
        )}
      </div>

      {/* Column Footer: + Create card */}
      {canCreateTask && (
        <div className="pt-2">
          <Button
            variant="ghost"
            onClick={() => onQuickAdd(column.id)}
            className="w-full justify-start text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl h-8 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create card
          </Button>
        </div>
      )}
    </div>
  );
};

