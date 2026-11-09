import React, { useState } from "react";
import { useParams } from "react-router-dom";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useAuth } from "@/features/auth";
import { useAuthContext } from "@/context/auth-provider";
import { Permissions, TaskPriorityEnumType, TaskStatusEnumType } from "@/constant";
import useTaskTableFilter from "@/hooks/use-task-table-filter";
import { useProjectsQuery } from "@/features/project";
import { useTeamsQuery } from "@/features/team";
import { useTasksQuery, TaskType } from "@/features/task";
import { TaskBoardHeader } from "./board/task-board-header";
import { TaskBoardFilterToolbar } from "./board/task-board-filter-toolbar";
import { TaskBoard } from "./board/task-board";
import { DataTable } from "./table/table";
import { getColumns } from "./table/columns";
import { Calendar as CalendarIcon } from "lucide-react";
import TaskDetailSheet from "./task-detail-sheet";

interface TaskViewProps {
  projectId?: string;
}

export const TaskView: React.FC<TaskViewProps> = ({ projectId: propProjectId }) => {
  const param = useParams();
  const projectId = propProjectId || (param.projectId as string | undefined);
  const workspaceId = useWorkspaceId();

  const { data: authData } = useAuth();
  const currentUserId = authData?.user?._id;

  const { hasPermission } = useAuthContext();
  const canCreateTask = hasPermission(Permissions.TASK_CREATE);

  const [filters, setFilters] = useTaskTableFilter();
  const viewMode = (filters.view as "board" | "list" | "calendar") || "board";

  const [groupBy, setGroupBy] = useState<"none" | "project" | "priority" | "assignee">(
    "none"
  );
  const [recentlyUpdated, setRecentlyUpdated] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(viewMode === "board" ? 100 : 10);

  // When switching views, adjust page size if needed
  const handleViewChange = (newView: "board" | "list" | "calendar") => {
    setFilters({
      ...filters,
      view: newView,
    });
    if (newView === "board") {
      setPageSize(100);
    } else {
      setPageSize(10);
    }
  };

  // Projects in workspace
  const { data: projectsData } = useProjectsQuery({
    workspaceId,
  });
  const projects = projectsData?.projects || [];

  // Teams in workspace
  const { data: teamsData } = useTeamsQuery({
    workspaceId,
    pageSize: 50,
  });
  const teams = teamsData?.teams || [];

  // Default to current user's tasks ("by default my task") unless explicitly set to "all"
  const effectiveAssigneeId =
    filters.assigneeId === "all"
      ? null
      : (filters.assigneeId || currentUserId || null);

  // Query tasks with keepPreviousData to completely eliminate "jhatka" (layout shifts / blank flickers)
  const { data, isLoading, isFetching } = useTasksQuery({
    workspaceId,
    keyword: filters.keyword,
    priority: (filters.priority as TaskPriorityEnumType) || null,
    status: (filters.status as TaskStatusEnumType) || null,
    projectId: projectId || filters.projectId,
    assignedTo: effectiveAssigneeId,
    teamId: filters.teamId,
    pageNumber,
    pageSize,
  });

  const isRefetching = isFetching && !isLoading;
  const tasks: TaskType[] = data?.tasks || [];
  const totalCount = data?.pagination?.totalCount || tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;

  const columns = getColumns(projectId);

  return (
    <div className="w-full space-y-3">
      {/* 1. Header with Sprint chip, Column count, New Task, and View Switcher */}
      <TaskBoardHeader
        view={viewMode}
        onViewChange={handleViewChange}
        columnCount={5}
        totalTasks={totalCount}
        completedTasks={completedTasks}
        projectId={projectId}
        canCreateTask={canCreateTask}
      />

      {/* 2. Filter & Group toolbar */}
      <TaskBoardFilterToolbar
        filters={filters}
        setFilters={setFilters}
        isRefetching={isRefetching}
        projects={projects}
        teams={teams}
        currentUserId={currentUserId}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        recentlyUpdated={recentlyUpdated}
        setRecentlyUpdated={setRecentlyUpdated}
      />

      {/* 3. Main Views */}
      {viewMode === "board" && (
        <TaskBoard
          tasks={tasks}
          isLoading={isLoading}
          isRefetching={isRefetching}
          projectId={projectId}
          groupBy={groupBy}
          recentlyUpdated={recentlyUpdated}
          canCreateTask={canCreateTask}
        />
      )}

      {viewMode === "list" && (
        <div className="w-full relative">
          {/* Top progress indicator when refetching list */}
          {isRefetching && (
            <div className="relative w-full h-1 bg-muted rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-primary animate-[pulse_1s_ease-in-out_infinite] w-full rounded-full" />
            </div>
          )}
          <DataTable
            isLoading={isLoading}
            data={tasks}
            columns={columns}
            onRowClick={(task) => setSelectedTask(task)}
            onPageChange={setPageNumber}
            onPageSizeChange={setPageSize}
            pagination={{
              totalCount,
              pageNumber,
              pageSize,
            }}
          />
        </div>
      )}

      {viewMode === "calendar" && (
        <div className="border border-dashed border-border/80 rounded-2xl p-12 text-center space-y-3 bg-muted/20">
          <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground/60" />
          <h3 className="font-semibold text-foreground text-base">Calendar View</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            View scheduled tasks by their due dates. Switch back to Board or List to manage cards.
          </p>
        </div>
      )}

      {/* Slide-over Task Detail Sheet */}
      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default TaskView;
