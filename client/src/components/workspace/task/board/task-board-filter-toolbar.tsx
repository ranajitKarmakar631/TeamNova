import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  X,
  ChevronDown,
  SlidersHorizontal,
  Loader2,
  Flag,
  FolderKanban,
  Users2,
  UserCheck,
} from "lucide-react";
import { TaskPriorityEnum } from "@/constant";
import useDebounce from "@/hooks/use-debounce";

interface FilterState {
  keyword?: string | null;
  priority?: string | null;
  status?: string | null;
  projectId?: string | null;
  assigneeId?: string | null;
  teamId?: string | null;
  view?: string | null;
}

interface TaskBoardFilterToolbarProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  isRefetching?: boolean;
  projects?: { _id: string; name: string; emoji?: string }[];
  teams?: { _id: string; name: string }[];
  currentUserId?: string;
  groupBy: "none" | "project" | "priority" | "assignee";
  setGroupBy: (val: "none" | "project" | "priority" | "assignee") => void;
  recentlyUpdated: boolean;
  setRecentlyUpdated: (val: boolean) => void;
}

export const TaskBoardFilterToolbar: React.FC<TaskBoardFilterToolbarProps> = ({
  filters,
  setFilters,
  isRefetching = false,
  projects = [],
  teams = [],
  currentUserId,
  groupBy,
  setGroupBy,
  recentlyUpdated,
  setRecentlyUpdated,
}) => {
  const [searchValue, setSearchValue] = useState(filters.keyword || "");
  const debouncedSearch = useDebounce(searchValue, 300);

  useEffect(() => {
    setSearchValue(filters.keyword || "");
  }, [filters.keyword]);

  useEffect(() => {
    if ((debouncedSearch || null) !== (filters.keyword || null)) {
      setFilters({
        ...filters,
        keyword: debouncedSearch ? debouncedSearch : null,
      });
    }
  }, [debouncedSearch]);

  // By default, filter to current user's tasks
  const isOnlyMyTasks =
    filters.assigneeId === currentUserId ||
    (filters.assigneeId === null && Boolean(currentUserId));

  const toggleOnlyMyTasks = () => {
    if (isOnlyMyTasks) {
      setFilters({
        ...filters,
        assigneeId: "all",
      });
    } else if (currentUserId) {
      setFilters({
        ...filters,
        assigneeId: currentUserId,
      });
    }
  };

  const handlePrioritySelect = (priority: string | null) => {
    setFilters({
      ...filters,
      priority,
    });
  };

  const handleProjectSelect = (projectId: string | null) => {
    setFilters({
      ...filters,
      projectId,
    });
  };

  const handleTeamSelect = (teamId: string | null) => {
    setFilters({
      ...filters,
      teamId,
    });
  };

  // Calculate number of active filters
  let activeCount = 0;
  if (filters.keyword) activeCount++;
  if (filters.priority) activeCount++;
  if (filters.projectId) activeCount++;
  if (filters.teamId) activeCount++;
  if (filters.assigneeId) activeCount++;
  if (filters.status) activeCount++;
  if (recentlyUpdated) activeCount++;

  const handleResetFilters = () => {
    setSearchValue("");
    setRecentlyUpdated(false);
    setFilters({
      keyword: null,
      priority: null,
      projectId: null,
      teamId: null,
      assigneeId: null,
      status: null,
    });
  };

  // Selected labels
  const selectedProject = projects.find((p) => p._id === filters.projectId);
  const selectedTeam = teams.find((t) => t._id === filters.teamId);

  return (
    <div className="flex flex-col gap-3 py-2 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Filter Section */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Search Input */}
          <div className="relative min-w-[220px] max-w-[280px] w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tasks, codes or tags..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-8.5 pl-8.5 pr-7 text-xs bg-card border-border/80 rounded-xl"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* "Only my tasks" Toggle */}
          {currentUserId && (
            <Button
              type="button"
              variant={isOnlyMyTasks ? "secondary" : "outline"}
              onClick={toggleOnlyMyTasks}
              className={`h-8 px-3 text-xs rounded-xl font-medium transition-all ${
                isOnlyMyTasks
                  ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15"
                  : "bg-card text-muted-foreground hover:text-foreground border-border/80"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" />
              Only my tasks
            </Button>
          )}

          {/* "Recently updated" Toggle */}
          <Button
            type="button"
            variant={recentlyUpdated ? "secondary" : "outline"}
            onClick={() => setRecentlyUpdated(!recentlyUpdated)}
            className={`h-8 px-3 text-xs rounded-xl font-medium transition-all ${
              recentlyUpdated
                ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15"
                : "bg-card text-muted-foreground hover:text-foreground border-border/80"
            }`}
          >
            Recently updated
          </Button>

          {/* Priority Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={`h-8 px-3 text-xs rounded-xl font-medium bg-card border-border/80 gap-1.5 ${
                  filters.priority ? "text-primary border-primary/40 bg-primary/5" : "text-muted-foreground"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>
                  Priority: {filters.priority ? filters.priority : "All"}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36 text-xs">
              <DropdownMenuItem onClick={() => handlePrioritySelect(null)}>
                All Priorities
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrioritySelect(TaskPriorityEnum.LOW)}>
                Low
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrioritySelect(TaskPriorityEnum.MEDIUM)}>
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrioritySelect(TaskPriorityEnum.HIGH)}>
                High
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Project Dropdown */}
          {projects.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-8 px-3 text-xs rounded-xl font-medium bg-card border-border/80 gap-1.5 max-w-[200px] ${
                    filters.projectId ? "text-primary border-primary/40 bg-primary/5" : "text-muted-foreground"
                  }`}
                >
                  <FolderKanban className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    Project: {selectedProject ? selectedProject.name : "All"}
                  </span>
                  <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 text-xs max-h-60 overflow-y-auto">
                <DropdownMenuItem onClick={() => handleProjectSelect(null)}>
                  All Projects
                </DropdownMenuItem>
                {projects.map((proj) => (
                  <DropdownMenuItem
                    key={proj._id}
                    onClick={() => handleProjectSelect(proj._id)}
                    className="flex items-center gap-1.5"
                  >
                    <span>{proj.emoji || "📁"}</span>
                    <span className="truncate">{proj.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Team Dropdown */}
          {teams.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-8 px-3 text-xs rounded-xl font-medium bg-card border-border/80 gap-1.5 max-w-[180px] ${
                    filters.teamId ? "text-primary border-primary/40 bg-primary/5" : "text-muted-foreground"
                  }`}
                >
                  <Users2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    Team: {selectedTeam ? selectedTeam.name : "All"}
                  </span>
                  <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44 text-xs max-h-60 overflow-y-auto">
                <DropdownMenuItem onClick={() => handleTeamSelect(null)}>
                  All Teams
                </DropdownMenuItem>
                {teams.map((tm) => (
                  <DropdownMenuItem
                    key={tm._id}
                    onClick={() => handleTeamSelect(tm._id)}
                  >
                    <span className="truncate">{tm.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Active Filters Clear Badge */}
          {activeCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 px-2.5 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 gap-1.5 transition-colors"
            >
              <span>{activeCount} active</span>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Refetching Loading Indicator */}
          {isRefetching && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium animate-pulse ml-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>

        {/* Right Section: Group By & Options */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <span>GROUP BY:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 px-2.5 text-xs rounded-xl font-medium bg-card border-border/80 gap-1 text-foreground"
                >
                  <span>
                    {groupBy === "none" && "None (Default)"}
                    {groupBy === "project" && "Project"}
                    {groupBy === "priority" && "Priority"}
                    {groupBy === "assignee" && "Assignee"}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 text-xs">
                <DropdownMenuItem onClick={() => setGroupBy("none")}>
                  None (Default)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("project")}>
                  Project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("priority")}>
                  Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("assignee")}>
                  Assignee
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-xl bg-card border-border/80 text-muted-foreground hover:text-foreground"
            title="Display options"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

