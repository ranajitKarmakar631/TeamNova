import React, { useState } from "react";
import { TaskStatusEnum, TaskStatusEnumType } from "@/constant";
import { ColumnDefinition, TaskColumn } from "./task-column";
import EditTaskDialog from "../edit-task-dialog";
import CreateTaskDialog from "../create-task-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateTaskMutation, TaskType } from "@/features/task";
import { toast } from "@/hooks/use-toast";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskBoardProps {
  tasks: TaskType[];
  isLoading?: boolean;
  isRefetching?: boolean;
  projectId?: string;
  groupBy?: "none" | "project" | "priority" | "assignee";
  recentlyUpdated?: boolean;
  canCreateTask?: boolean;
}

const COLUMNS: ColumnDefinition[] = [
  {
    id: TaskStatusEnum.BACKLOG,
    title: "BACKLOG",
    dotClass: "bg-slate-400",
  },
  {
    id: TaskStatusEnum.TODO,
    title: "TO DO",
    dotClass: "bg-blue-500",
  },
  {
    id: TaskStatusEnum.IN_PROGRESS,
    title: "IN PROGRESS",
    dotClass: "bg-amber-500",
    wipLimit: 5,
  },
  {
    id: TaskStatusEnum.IN_REVIEW,
    title: "IN REVIEW",
    dotClass: "bg-purple-500",
  },
  {
    id: TaskStatusEnum.DONE,
    title: "DONE",
    dotClass: "bg-emerald-500",
  },
];

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  isLoading = false,
  isRefetching = false,
  projectId,
  groupBy = "none",
  recentlyUpdated = false,
  canCreateTask = true,
}) => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatusEnumType | null>(
    null
  );

  // Edit Task Dialog state
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);

  // Quick Create Dialog state (specific status)
  const [quickCreateStatus, setQuickCreateStatus] =
    useState<TaskStatusEnumType | null>(null);

  // Mutation for updating task status on drop
  const { mutateAsync: editTask } = useUpdateTaskMutation();

  const draggedTask = tasks.find((t) => t._id === draggedTaskId) || null;

  // Drag handlers
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    task: TaskType
  ) => {
    e.dataTransfer.setData("text/plain", task._id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(task._id);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    status: TaskStatusEnumType
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    targetStatus: TaskStatusEnumType
  ) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDragOverColumn(null);
    setDraggedTaskId(null);

    if (!taskId) return;

    const taskToMove = tasks.find((t) => t._id === taskId);
    if (!taskToMove || taskToMove.status === targetStatus) return;

    const previousStatus = taskToMove.status;

    // 1. Optimistically update all queries for all-tasks in this workspace
    queryClient.setQueriesData<any>(
      { queryKey: ["all-tasks", workspaceId] },
      (oldData: any) => {
        if (!oldData || !oldData.tasks) return oldData;
        return {
          ...oldData,
          tasks: oldData.tasks.map((t: TaskType) =>
            t._id === taskId ? { ...t, status: targetStatus } : t
          ),
        };
      }
    );

    // 2. Perform API update
    try {
      await editTask({
        taskId,
        projectId: taskToMove.project?._id || projectId || "",
        workspaceId,
        data: {
          status: targetStatus,
        },
      });

      // Quietly invalidate queries to sync state with server
      queryClient.invalidateQueries({
        queryKey: ["all-tasks", workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-analytics", workspaceId],
      });
    } catch (err: any) {
      // Revert optimistic update
      queryClient.setQueriesData<any>(
        { queryKey: ["all-tasks", workspaceId] },
        (oldData: any) => {
          if (!oldData || !oldData.tasks) return oldData;
          return {
            ...oldData,
            tasks: oldData.tasks.map((t: TaskType) =>
              t._id === taskId ? { ...t, status: previousStatus } : t
            ),
          };
        }
      );

      toast({
        title: "Could not update task",
        description:
          err?.response?.data?.message ||
          "Failed to move task. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter or sort tasks if "recentlyUpdated" or "groupBy" is active
  let displayedTasks = [...tasks];
  if (recentlyUpdated) {
    displayedTasks.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  } else if (groupBy === "priority") {
    const priorityWeights: Record<string, number> = {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };
    displayedTasks.sort(
      (a, b) =>
        (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0)
    );
  } else if (groupBy === "project") {
    displayedTasks.sort((a, b) =>
      (a.project?.name || "").localeCompare(b.project?.name || "")
    );
  } else if (groupBy === "assignee") {
    displayedTasks.sort((a, b) => {
      const aName = Array.isArray(a.assignedTo)
        ? a.assignedTo[0]?.name || ""
        : a.assignedTo?.name || "";
      const bName = Array.isArray(b.assignedTo)
        ? b.assignedTo[0]?.name || ""
        : b.assignedTo?.name || "";
      return aName.localeCompare(bName);
    });
  }

  // Initial loading skeleton
  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="flex flex-col min-w-[280px] w-full max-w-[340px] bg-muted/30 border border-border/50 rounded-2xl p-3 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-6 h-4 rounded-full" />
              </div>
              <Skeleton className="w-6 h-6 rounded-lg" />
            </div>
            <div className="space-y-2.5">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Sleek top indeterminate progress line during refetching ("anti-jhatka") */}
      {isRefetching && (
        <div className="relative w-full h-1 bg-muted/60 rounded-full overflow-hidden mb-3 animate-in fade-in duration-150">
          <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-primary animate-[pulse_1s_ease-in-out_infinite] w-full rounded-full" />
        </div>
      )}

      {/* Columns Grid */}
      <div
        className={`flex gap-4 overflow-x-auto pb-6 pt-1 items-start transition-opacity duration-200 select-none ${
          isRefetching ? "opacity-85 pointer-events-auto" : "opacity-100"
        }`}
      >
        {COLUMNS.map((col) => {
          const colTasks = displayedTasks.filter((t) => t.status === col.id);

          return (
            <TaskColumn
              key={col.id}
              column={col}
              tasks={colTasks}
              draggedTask={draggedTask}
              isOver={dragOverColumn === col.id}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onCardClick={(task) => setEditingTask(task)}
              onQuickAdd={(status) => setQuickCreateStatus(status)}
              canCreateTask={canCreateTask}
            />
          );
        })}
      </div>

      {/* Edit Task Dialog */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Quick Create Task Dialog with pre-selected status */}
      {quickCreateStatus && (
        <CreateTaskDialog
          projectId={projectId}
          defaultStatus={quickCreateStatus}
          trigger={<span className="hidden" />}
        />
      )}
    </div>
  );
};
