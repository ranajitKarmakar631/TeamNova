import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetCalendarMeetingsQuery,
} from "@/features/meeting";

interface MeetingCalendarViewProps {
  workspaceId: string;
  onSelectMeeting: (meetingId: string) => void;
  onScheduleClick: () => void;
}

type CalendarViewMode = "month" | "week" | "day";

export const MeetingCalendarView: React.FC<MeetingCalendarViewProps> = ({
  workspaceId,
  onSelectMeeting,
  onScheduleClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [filterType, setFilterType] = useState<string>("all");

  // Calculate start and end range based on current date & viewMode
  const { startDate, endDate, dateRangeTitle } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === "month") {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
      const title = currentDate.toLocaleDateString([], {
        month: "long",
        year: "numeric",
      });
      return { startDate: start, endDate: end, dateRangeTitle: title };
    } else if (viewMode === "week") {
      const curr = new Date(currentDate);
      const firstDay = curr.getDate() - curr.getDay();
      const start = new Date(curr.setDate(firstDay));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      const title = `${start.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      })} - ${end.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
      return { startDate: start, endDate: end, dateRangeTitle: title };
    } else {
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      const title = currentDate.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return { startDate: start, endDate: end, dateRangeTitle: title };
    }
  }, [currentDate, viewMode]);

  const { data } = useGetCalendarMeetingsQuery(
    workspaceId,
    startDate.toISOString(),
    endDate.toISOString(),
    filterType === "all" ? undefined : filterType
  );

  const meetings = data?.meetings || [];

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => setCurrentDate(new Date());

  // Hours for grid (9 AM to 7 PM)
  const hours = Array.from({ length: 11 }, (_, i) => i + 9);

  // Generate days for week view
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const temp = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      days.push(new Date(temp));
      temp.setDate(temp.getDate() + 1);
    }
    return days;
  }, [startDate]);

  const getMeetingColor = (audience: string) => {
    switch (audience) {
      case "PROJECT":
        return "bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300";
      case "TEAM":
      case "MULTIPLE_TEAMS":
        return "bg-blue-500/15 border-blue-500/40 text-blue-800 dark:text-blue-300";
      case "CUSTOM":
      case "INDIVIDUAL":
        return "bg-purple-500/15 border-purple-500/40 text-purple-800 dark:text-purple-300";
      default:
        return "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300";
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-lg text-foreground">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <span>Calendar</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="h-8 text-xs font-medium"
            >
              Today
            </Button>
          </div>

          <span className="text-sm font-semibold text-foreground ml-2">
            {dateRangeTitle}
          </span>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center border rounded-lg overflow-hidden p-0.5 bg-muted/40">
            {(["month", "week", "day"] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-medium capitalize rounded-md transition-colors ${
                  viewMode === mode
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={onScheduleClick}
            className="h-8 text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground mr-1">Filter:</span>
        {[
          { label: "All Meetings", value: "all" },
          { label: "● My Meetings", value: "my-meetings" },
          { label: "● Team Meetings", value: "team-meetings" },
          { label: "● Project Meetings", value: "project-meetings" },
          { label: "● Workspace Meetings", value: "workspace-meetings" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterType(f.value)}
            className={`px-2.5 py-1 rounded-full border transition-colors ${
              filterType === f.value
                ? "bg-primary text-primary-foreground border-primary font-medium"
                : "bg-muted/30 text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Main Calendar Display */}
      {viewMode === "week" && (
        <div className="border rounded-xl bg-card overflow-x-auto shadow-xs">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b text-center text-xs font-semibold divide-x bg-muted/30">
            <div className="p-3 text-muted-foreground">Time</div>
            {weekDays.map((d, idx) => {
              const isToday =
                new Date().toDateString() === d.toDateString();
              return (
                <div
                  key={idx}
                  className={`p-3 space-y-0.5 ${
                    isToday ? "bg-primary/10 text-primary font-bold" : ""
                  }`}
                >
                  <p className="text-[11px] text-muted-foreground uppercase">
                    {d.toLocaleDateString([], { weekday: "short" })}
                  </p>
                  <p className="text-sm">{d.getDate()}</p>
                </div>
              );
            })}
          </div>

          {/* Time Slots Grid */}
          <div className="divide-y divide-border/60">
            {hours.map((hour) => {
              const displayHour =
                hour === 12
                  ? "12 PM"
                  : hour > 12
                  ? `${hour - 12} PM`
                  : `${hour} AM`;

              return (
                <div key={hour} className="grid grid-cols-8 divide-x divide-border/60 min-h-[64px]">
                  {/* Time label */}
                  <div className="p-2 text-[11px] text-muted-foreground text-center font-medium bg-muted/10">
                    {displayHour}
                  </div>

                  {/* Day column slots */}
                  {weekDays.map((day, dIdx) => {
                    // Find meetings that occur on this day during this hour
                    const slotMeetings = meetings.filter((m) => {
                      const mStart = new Date(m.startAt);
                      return (
                        mStart.toDateString() === day.toDateString() &&
                        mStart.getHours() === hour
                      );
                    });

                    return (
                      <div
                        key={dIdx}
                        className="p-1 space-y-1 relative hover:bg-muted/10 transition-colors"
                      >
                        {slotMeetings.map((sm) => (
                          <div
                            key={sm._id}
                            onClick={() => onSelectMeeting(sm._id)}
                            className={`p-2 rounded-md border text-xs cursor-pointer shadow-xs hover:brightness-95 transition-all ${getMeetingColor(
                              sm.audience
                            )}`}
                          >
                            <p className="font-semibold truncate">{sm.title}</p>
                            <p className="text-[10px] opacity-80">
                              {new Date(sm.startAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === "month" && (
        <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
          <div className="p-4 grid grid-cols-7 border-b text-center text-xs font-semibold uppercase text-muted-foreground bg-muted/20">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y border-b text-xs min-h-[360px]">
            {Array.from({ length: 35 }).map((_, idx) => {
              const dayNum = idx + 1;
              const matchingMeetings = meetings.filter((m) => {
                const start = new Date(m.startAt);
                return start.getDate() === dayNum && start.getMonth() === currentDate.getMonth();
              });

              return (
                <div key={idx} className="p-2 min-h-[90px] space-y-1 hover:bg-muted/10">
                  <span className="font-semibold text-muted-foreground block text-right">
                    {dayNum <= 31 ? dayNum : ""}
                  </span>
                  {dayNum <= 31 && (
                    <div className="space-y-1">
                      {matchingMeetings.slice(0, 2).map((m) => (
                        <div
                          key={m._id}
                          onClick={() => onSelectMeeting(m._id)}
                          className={`p-1 rounded text-[11px] truncate border cursor-pointer ${getMeetingColor(
                            m.audience
                          )}`}
                        >
                          {m.title}
                        </div>
                      ))}
                      {matchingMeetings.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{matchingMeetings.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === "day" && (
        <div className="border rounded-xl bg-card p-4 space-y-3 shadow-xs">
          <h4 className="font-semibold text-sm">
            Schedule for {currentDate.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </h4>
          <div className="divide-y space-y-2">
            {meetings.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-xs italic">
                No meetings scheduled for this day.
              </p>
            ) : (
              meetings.map((m) => (
                <div
                  key={m._id}
                  onClick={() => onSelectMeeting(m._id)}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/20 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                      {new Date(m.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({m.timezone})
                    </p>
                  </div>
                  <Badge variant="outline">{m.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingCalendarView;
