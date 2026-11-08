import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ArrowUpDown,
  Crown,
  Shield,
  Users,
  Loader,
  AlertCircle,
  ChevronRight,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useDebounce from "@/hooks/use-debounce";
import { getProjectMembersQueryFn } from "@/lib/api";
import { ProjectMemberItemType } from "@/types/api.type";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import MemberDetailsDrawer from "./member-details-drawer";

export const ProjectMembers = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const workspaceId = useWorkspaceId();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [teamFilter, setTeamFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"tasks" | "completion" | "name">("tasks");

  const [selectedMember, setSelectedMember] = useState<ProjectMemberItemType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch project members with debounced search, filters, and sorting handled on the backend
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: [
      "project-members",
      projectId,
      workspaceId,
      debouncedSearch,
      teamFilter,
      roleFilter,
      sortBy,
    ],
    queryFn: () =>
      getProjectMembersQueryFn({
        workspaceId,
        projectId: projectId!,
        search: debouncedSearch.trim() || undefined,
        teamId: teamFilter !== "ALL" ? teamFilter : undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        sortBy,
      }),
    enabled: Boolean(workspaceId && projectId),
  });

  const members = data?.members || [];
  const totalCount = data?.totalCount ?? members.length;

  // Extract unique team names for the filter dropdown (provided by backend or fallback)
  const uniqueTeams = useMemo(() => {
    if (data?.teams && data.teams.length > 0) {
      return data.teams;
    }
    const map = new Map<string, string>();
    members.forEach((m) => {
      m.teams?.forEach((t) => {
        if (t._id && t.name) map.set(t._id, t.name);
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data?.teams, members]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || teamFilter !== "ALL" || roleFilter !== "ALL"
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setTeamFilter("ALL");
    setRoleFilter("ALL");
    setSortBy("tasks");
  };

  const handleOpenMember = (member: ProjectMemberItemType) => {
    setSelectedMember(member);
    setIsDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 rounded-xl border border-destructive/20 bg-destructive/5 space-y-2">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
        <p className="text-sm font-semibold text-destructive">Failed to load project members</p>
        <p className="text-xs text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <span>Project Contributors & Roles ({totalCount})</span>
              {isFetching && !isLoading && (
                <Loader className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              All unique members collaborating on this project. Click any member to inspect assigned tasks and individual KPIs.
            </p>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs h-8 text-muted-foreground hover:text-foreground gap-1 px-2.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9 bg-card"
            />
          </div>

          {/* Filter by Team */}
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-[150px] text-xs h-9 bg-card">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Teams</SelectItem>
              {uniqueTeams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter by Project Role */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px] text-xs h-9 bg-card">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="HEAD">Heads</SelectItem>
              <SelectItem value="LEAD">Leads</SelectItem>
              <SelectItem value="MEMBER">Members</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="w-[150px] text-xs h-9 bg-card ml-auto">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tasks">Most Tasks</SelectItem>
              <SelectItem value="completion">Highest Completion</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed bg-muted/20 space-y-2">
          <Users className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h4 className="text-sm font-semibold text-foreground">No Members Found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No project members matched the selected filters. Try clearing search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {members.map((member) => {
            const name = member.user?.name || "Unknown Member";
            const initials = getAvatarFallbackText(name);
            const avatarColor = getAvatarColor(name);

            return (
              <Card
                key={member.memberId}
                className="hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow group bg-card"
                onClick={() => handleOpenMember(member)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Member identity */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0 group-hover:scale-105 transition-transform">
                        <AvatarImage src={member.user?.profilePicture || ""} alt={name} />
                        <AvatarFallback className={`text-xs ${avatarColor}`}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {member.user?.email}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 mt-1" />
                  </div>

                  {/* Roles and Teams */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] py-0 px-1.5 font-medium ${
                        member.projectRole === "HEAD"
                          ? "border-amber-500/30 text-amber-600 bg-amber-50/50"
                          : member.projectRole === "LEAD"
                          ? "border-indigo-500/30 text-indigo-600 bg-indigo-50/50"
                          : "border-slate-300 text-slate-600"
                      }`}
                    >
                      {member.projectRole === "HEAD" && <Crown className="w-2.5 h-2.5 mr-1" />}
                      {member.projectRole === "LEAD" && <Shield className="w-2.5 h-2.5 mr-1" />}
                      {member.projectRole}
                    </Badge>

                    {member.teams?.map((t) => (
                      <Badge
                        key={t._id}
                        variant="secondary"
                        className="text-[10px] py-0 px-1.5 font-normal"
                      >
                        {t.name}
                      </Badge>
                    ))}
                  </div>

                  {/* Task KPI summary bar */}
                  <div className="space-y-1.5 pt-1 border-t text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Execution Progress</span>
                      <span className="font-bold text-primary">
                        {member.completionPercentage}% ({member.completedTasks}/{member.totalAssignedTasks} Done)
                      </span>
                    </div>

                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${member.completionPercentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                      <span>In Progress: <strong className="text-foreground">{member.inProgressTasks}</strong></span>
                      {member.overdueTasks > 0 ? (
                        <span className="text-destructive font-semibold">⚠️ {member.overdueTasks} Overdue</span>
                      ) : (
                        <span>Pending: <strong className="text-foreground">{member.pendingTasks}</strong></span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Member Details Drawer */}
      <MemberDetailsDrawer
        member={selectedMember}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        workspaceId={workspaceId}
        projectId={projectId!}
      />
    </div>
  );
};

export default ProjectMembers;
