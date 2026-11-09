import { useState } from "react";
import {
  CalendarDays,
  Plus,
  Video,
  MoreVertical,
  Calendar,
  Users,
  Backpack,
  Sparkles,
  ArrowRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useAuthContext } from "@/context/auth-provider";
import { Permissions } from "@/constant";
import {
  useGetAllMeetingsQuery,
  useGetMeetingStatsQuery,
  IMeeting,
} from "@/features/meeting";
import MeetingStatsCards from "@/components/meeting/MeetingStatsCards";
import ScheduleMeetingDrawer from "@/components/meeting/ScheduleMeetingDrawer";
import MeetingDetailsDrawer from "@/components/meeting/MeetingDetailsDrawer";
import MeetingCalendarView from "@/components/meeting/MeetingCalendarView";
import { toast } from "@/hooks/use-toast";

type ViewTab = "dashboard" | "calendar" | "my-meetings";

export const MeetingsPage = () => {
  const workspaceId = useWorkspaceId();
  const { hasPermission } = useAuthContext();
  const canCreateMeeting = hasPermission(Permissions.MEETING_CREATE);

  const [activeTab, setActiveTab] = useState<ViewTab>("dashboard");
  const [search, setSearch] = useState("");

  // Drawer states
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  // Queries
  const { data: statsData, isLoading: isStatsLoading } = useGetMeetingStatsQuery(workspaceId);
  const { data: meetingsData, isLoading: isMeetingsLoading } = useGetAllMeetingsQuery({
    workspaceId,
    search: search.trim() || undefined,
    myMeetings: activeTab === "my-meetings" ? true : undefined,
  });

  const meetings = meetingsData?.meetings || [];
  const stats = statsData?.stats;

  const handleOpenDetails = (id: string) => {
    setSelectedMeetingId(id);
  };

  const handleCopyLink = (m: IMeeting) => {
    if (m.meetingLink) {
      navigator.clipboard.writeText(m.meetingLink);
      toast({ title: "Link Copied", description: "Meeting URL copied to clipboard." });
    }
  };

  const getAudienceBadge = (audience: string) => {
    switch (audience) {
      case "PROJECT":
        return <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">Project</Badge>;
      case "TEAM":
      case "MULTIPLE_TEAMS":
        return <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">Team</Badge>;
      case "CUSTOM":
      case "INDIVIDUAL":
        return <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-300">Custom</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Workspace</Badge>;
    }
  };

  const getCategoryIcon = (audience: string) => {
    switch (audience) {
      case "PROJECT":
        return <Backpack className="w-4 h-4 text-emerald-500" />;
      case "TEAM":
      case "MULTIPLE_TEAMS":
        return <Users className="w-4 h-4 text-blue-500" />;
      default:
        return <CalendarDays className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <main className="flex flex-1 flex-col py-4 md:pt-3 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Meetings</h2>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Plan, collaborate and keep your team aligned.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Tab Switcher */}
          <div className="flex items-center border rounded-lg p-0.5 bg-muted/30 text-xs">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === "dashboard"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === "calendar"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab("my-meetings")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === "my-meetings"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              My Meetings
            </button>
          </div>

          {canCreateMeeting && (
            <Button
              onClick={() => setIsScheduleOpen(true)}
              className="gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Meeting</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4 Stat Cards */}
      <MeetingStatsCards stats={stats} isLoading={isStatsLoading} />

      {/* TAB CONTENT: CALENDAR VIEW */}
      {activeTab === "calendar" ? (
        <MeetingCalendarView
          workspaceId={workspaceId}
          onSelectMeeting={handleOpenDetails}
          onScheduleClick={() => setIsScheduleOpen(true)}
        />
      ) : (
        /* DASHBOARD / MY MEETINGS VIEW: 2-COLUMN LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: MEETINGS LIST */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-xl border bg-card shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground">
                    {activeTab === "my-meetings" ? "My Scheduled Meetings" : "Upcoming Meetings"}
                  </h3>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {meetings.length}
                  </Badge>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search meetings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
              </div>

              {/* Meeting Items List */}
              <div className="space-y-3">
                {isMeetingsLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : meetings.length === 0 ? (
                  <div className="py-12 text-center space-y-2 border border-dashed rounded-lg">
                    <Calendar className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-sm font-medium text-foreground">No meetings found</p>
                    <p className="text-xs text-muted-foreground">
                      {search
                        ? "Try searching with different keywords."
                        : "Ready to sync? Schedule your first meeting now."}
                    </p>
                    {canCreateMeeting && !search && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsScheduleOpen(true)}
                        className="mt-2 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Schedule Meeting
                      </Button>
                    )}
                  </div>
                ) : (
                  meetings.map((m) => {
                    const startDate = new Date(m.startAt);
                    const endDate = new Date(m.endAt);
                    const isToday =
                      new Date().toDateString() === startDate.toDateString();

                    const timeStr = `${
                      isToday ? "Today" : startDate.toLocaleDateString([], { month: "short", day: "numeric" })
                    } · ${startDate.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} - ${endDate.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`;

                    return (
                      <div
                        key={m._id}
                        className="p-3.5 rounded-xl border bg-card hover:bg-muted/30 transition-all flex flex-wrap items-center justify-between gap-3 shadow-2xs group cursor-pointer"
                        onClick={() => handleOpenDetails(m._id)}
                      >
                        {/* Icon & Title */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                            {getCategoryIcon(m.audience)}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                                {m.title}
                              </h4>
                              {getAudienceBadge(m.audience)}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                              {timeStr}
                            </p>
                          </div>
                        </div>

                        {/* Avatars, Status, Actions */}
                        <div
                          className="flex items-center gap-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Avatars stack */}
                          {m.participants && m.participants.length > 0 && (
                            <div className="flex items-center -space-x-2 overflow-hidden">
                              {m.participants.slice(0, 3).map((p, idx) => (
                                <Avatar
                                  key={idx}
                                  className="inline-block h-6 w-6 rounded-full ring-2 ring-background"
                                >
                                  <AvatarImage src={p.userId?.profilePicture} />
                                  <AvatarFallback className="text-[9px]">
                                    {p.userId?.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {(m.participantCount ?? 0) > 3 && (
                                <span className="inline-flex items-center justify-center h-6 px-1.5 text-[10px] font-semibold text-muted-foreground rounded-full bg-muted border">
                                  +{(m.participantCount ?? 0) - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Status badge */}
                          <Badge
                            variant={
                              m.status === "SCHEDULED"
                                ? "default"
                                : m.status === "IN_PROGRESS"
                                ? "destructive"
                                : m.status === "COMPLETED"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-[11px] capitalize"
                          >
                            {m.status.toLowerCase().replace("_", " ")}
                          </Badge>

                          {/* Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem onClick={() => handleOpenDetails(m._id)}>
                                View Details & Agenda
                              </DropdownMenuItem>
                              {m.meetingLink && (
                                <DropdownMenuItem onClick={() => window.open(m.meetingLink, "_blank")}>
                                  <Video className="w-3.5 h-3.5 mr-1 text-primary" />
                                  Join Video Meeting
                                </DropdownMenuItem>
                              )}
                              {m.meetingLink && (
                                <DropdownMenuItem onClick={() => handleCopyLink(m)}>
                                  Copy Meeting Link
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT 1 COLUMN: STAY ALIGNED BANNER & QUICK INFO */}
          <div className="space-y-4">
            {/* Promo Card matching reference layout */}
            <div className="p-6 rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-primary/5 shadow-xs text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-lg text-foreground">
                  Stay Aligned Together
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed px-2">
                  Schedule meetings, collaborate on agendas, record decisions and turn discussion outcomes into actionable project tasks.
                </p>
              </div>

              {canCreateMeeting && (
                <Button
                  onClick={() => setIsScheduleOpen(true)}
                  className="w-full gap-2 font-medium"
                >
                  <span>Schedule a Meeting</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Quick Tips / Shortcut Card */}
            <div className="p-4 rounded-xl border bg-card shadow-xs space-y-3">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Meeting Best Practices
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Add discussion topics in advance so attendees can prepare.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Document meeting minutes and record clear decisions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Convert key action items directly into TaskNova project tasks!</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* DRAWERS */}
      <ScheduleMeetingDrawer
        workspaceId={workspaceId}
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
      />

      <MeetingDetailsDrawer
        workspaceId={workspaceId}
        meetingId={selectedMeetingId}
        isOpen={!!selectedMeetingId}
        onClose={() => setSelectedMeetingId(null)}
      />
    </main>
  );
};

export default MeetingsPage;
