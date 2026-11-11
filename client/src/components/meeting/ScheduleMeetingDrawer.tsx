import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Globe,
  Plus,
  Trash2,
  Video,
  Link2,
  Bell,
  Paperclip,
  Check,
  Search,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LexicalEditor from "@/lib/lexical/LexicalEditor";
import {
  useCreateMeetingMutation,
  MeetingAudienceType,
  TopicPriorityType,
} from "@/features/meeting";
import useProjectsQuery from "@/features/project/hooks/use-projects";
import useTeamsQuery from "@/features/team/hooks/use-teams";
import useWorkspaceMembersQuery from "@/features/member/hooks/use-workspace-members";

interface ScheduleMeetingDrawerProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultAudience?: MeetingAudienceType;
  defaultProjectId?: string;
  defaultTeamId?: string;
}

const AUDIENCE_OPTIONS: Array<{ label: string; value: MeetingAudienceType }> = [
  { label: "Workspace", value: "WORKSPACE" },
  { label: "Project", value: "PROJECT" },
  { label: "Team", value: "TEAM" },
  { label: "Multiple Teams", value: "MULTIPLE_TEAMS" },
  { label: "Custom Members", value: "CUSTOM" },
  { label: "Individual", value: "INDIVIDUAL" },
];

const TIMEZONES = [
  { label: "India Standard Time (IST)", value: "Asia/Kolkata" },
  { label: "Coordinated Universal Time (UTC)", value: "UTC" },
  { label: "Eastern Time (US & Canada) (EST)", value: "America/New_York" },
  { label: "Pacific Time (US & Canada) (PST)", value: "America/Los_Angeles" },
  { label: "British Summer Time / GMT", value: "Europe/London" },
  { label: "Central European Time (CET)", value: "Europe/Paris" },
  { label: "Singapore / Hong Kong (SGT)", value: "Asia/Singapore" },
  { label: "Japan Standard Time (JST)", value: "Asia/Tokyo" },
];

export const ScheduleMeetingDrawer: React.FC<ScheduleMeetingDrawerProps> = ({
  workspaceId,
  isOpen,
  onClose,
  defaultAudience = "WORKSPACE",
  defaultProjectId,
  defaultTeamId,
}) => {
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const [audience, setAudience] = useState<MeetingAudienceType>(defaultAudience);
  const [projectId, setProjectId] = useState<string>(defaultProjectId || "");
  const [teamIds, setTeamIds] = useState<string[]>(
    defaultTeamId ? [defaultTeamId] : []
  );
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  const [provider, setProvider] = useState("GOOGLE_MEET");
  const [meetingLink, setMeetingLink] = useState("");

  const [topics, setTopics] = useState<
    Array<{ title: string; description: string; priority: TopicPriorityType }>
  >([
    { title: "Sprint Goals & Alignment", description: "", priority: "HIGH" },
    { title: "Blockers & Discussions", description: "", priority: "MEDIUM" },
  ]);

  const [reminderSettings, setReminderSettings] = useState({
    dailyReminder: true,
    fifteenMinutesBefore: true,
    fiveMinutesBefore: true,
    meetingStartNotification: true,
  });

  const [attachments, setAttachments] = useState<Array<{ name: string; url: string }>>([]);
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [showAddAttachment, setShowAddAttachment] = useState(false);

  // Queries for dynamic audience selection
  const { data: projectsData } = useProjectsQuery({ workspaceId });
  const { data: teamsData } = useTeamsQuery({ workspaceId });
  const { data: membersData } = useWorkspaceMembersQuery(workspaceId);

  const projects = projectsData?.projects || [];
  const teams = teamsData?.teams || [];
  const members = membersData?.members || [];

  const createMeetingMutation = useCreateMeetingMutation(workspaceId);

  // Topic handlers
  const handleAddTopic = () => {
    setTopics((prev) => [
      ...prev,
      { title: "", description: "", priority: "MEDIUM" },
    ]);
  };

  const handleUpdateTopic = (
    index: number,
    field: "title" | "description" | "priority",
    val: any
  ) => {
    setTopics((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, [field]: val } : t))
    );
  };

  const handleRemoveTopic = (index: number) => {
    setTopics((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddAttachment = () => {
    if (newAttachmentName.trim() && newAttachmentUrl.trim()) {
      setAttachments((prev) => [
        ...prev,
        { name: newAttachmentName.trim(), url: newAttachmentUrl.trim() },
      ]);
      setNewAttachmentName("");
      setNewAttachmentUrl("");
      setShowAddAttachment(false);
    }
  };

  const toggleTeamSelection = (tId: string) => {
    setTeamIds((prev) =>
      prev.includes(tId) ? prev.filter((id) => id !== tId) : [...prev, tId]
    );
  };

  const toggleUserSelection = (uId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(uId) ? prev.filter((id) => id !== uId) : [...prev, uId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Construct startAt and endAt UTC ISO strings
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    const validTopics = topics
      .filter((t) => t.title.trim().length > 0)
      .map((t) => ({
        title: t.title.trim(),
        description: t.description,
        priority: t.priority,
      }));

    createMeetingMutation.mutate(
      {
        title: title.trim(),
        description,
        audience,
        projectId: audience === "PROJECT" ? projectId || null : null,
        teamIds:
          audience === "TEAM"
            ? teamIds.slice(0, 1)
            : audience === "MULTIPLE_TEAMS"
            ? teamIds
            : [],
        startAt: startDateTime.toISOString(),
        endAt: endDateTime.toISOString(),
        timezone,
        meetingLink: meetingLink.trim(),
        meetingProvider: provider,
        participantUserIds:
          audience === "CUSTOM" || audience === "INDIVIDUAL" ? selectedUserIds : [],
        topics: validTopics,
        reminderSettings,
        attachments,
      },
      {
        onSuccess: () => {
          onClose();
          // Reset
          setTitle("");
          setDescription("");
        },
      }
    );
  };

  const filteredMembers = members.filter((m: any) => {
    const name = m.userId?.name || "";
    const email = m.userId?.email || "";
    const q = memberSearch.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl overflow-y-auto scrollbar-custom-track p-6 flex flex-col gap-6"
      >
        <SheetHeader className="text-left pb-3 border-b">
          <div className="flex items-center gap-2 text-primary font-semibold text-lg">
            <CalendarIcon className="w-5 h-5" />
            <SheetTitle className="text-xl">Schedule Meeting</SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Schedule a discussion, align team members, and prepare actionable topics.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 space-y-6">
          {/* SECTION A: MEETING DETAILS */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <span>Meeting Details</span>
            </h4>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-medium">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Sprint Planning, Backlog Refinement..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description & Objectives</Label>
              <div className="border rounded-md overflow-hidden bg-background">
                <LexicalEditor
                  value={description}
                  onChange={setDescription}
                  outputFormat="markdown"
                  placeholder="Discuss sprint goals, backlog, dependencies and blockers..."
                  showToolbar={true}
                  className="min-h-[120px]"
                />
              </div>
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs font-medium flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="startTime" className="text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endTime" className="text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Timezone
              </Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SECTION B: AUDIENCE SELECTION */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold tracking-tight text-foreground">
                Audience Scope
              </h4>
              <span className="text-xs text-muted-foreground">
                Who should attend this meeting?
              </span>
            </div>

            {/* Pill selections */}
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_OPTIONS.map((opt) => {
                const isSelected = audience === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAudience(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Audience Sub-selectors */}
            {audience === "PROJECT" && (
              <div className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
                <Label className="text-xs font-medium">Select Target Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p: any) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.emoji ? `${p.emoji} ` : ""}
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  All active members and leads of this project will automatically receive invitations.
                </p>
              </div>
            )}

            {audience === "TEAM" && (
              <div className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
                <Label className="text-xs font-medium">Select Target Team</Label>
                <Select
                  value={teamIds[0] || ""}
                  onValueChange={(val) => setTeamIds([val])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t: any) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {audience === "MULTIPLE_TEAMS" && (
              <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
                <Label className="text-xs font-medium">Select Teams</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto scrollbar-no-track">
                  {teams.map((t: any) => {
                    const isChecked = teamIds.includes(t._id);
                    return (
                      <label
                        key={t._id}
                        className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer ${
                          isChecked ? "bg-primary/10 border-primary" : "bg-card"
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleTeamSelection(t._id)}
                        />
                        <span className="truncate">{t.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {(audience === "CUSTOM" || audience === "INDIVIDUAL") && (
              <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Select Participants</Label>
                  <Badge variant="secondary" className="text-[11px]">
                    {selectedUserIds.length} Selected
                  </Badge>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search members by name or email..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>

                <div className="max-h-44 overflow-y-auto scrollbar-no-track space-y-1 divide-y divide-border/40">
                  {filteredMembers.map((m: any) => {
                    const u = m.userId;
                    if (!u) return null;
                    const isSelected = selectedUserIds.includes(u._id);
                    return (
                      <div
                        key={u._id}
                        onClick={() => toggleUserSelection(u._id)}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10" : "hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={u.profilePicture} />
                            <AvatarFallback className="text-[10px]">
                              {u.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION C: DISCUSSION TOPICS */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <span>Discussion Topics</span>
                <span className="text-xs text-muted-foreground font-normal">
                  ({topics.length})
                </span>
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTopic}
                className="h-7 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Topic
              </Button>
            </div>

            <div className="space-y-2">
              {topics.map((topic, idx) => (
                <div
                  key={idx}
                  className="p-3 border rounded-lg bg-card space-y-2 text-xs relative group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center text-muted-foreground font-semibold">
                      {idx + 1}.
                    </span>
                    <Input
                      placeholder="Topic title..."
                      value={topic.title}
                      onChange={(e) =>
                        handleUpdateTopic(idx, "title", e.target.value)
                      }
                      className="h-8 text-xs font-medium flex-1"
                    />
                    <Select
                      value={topic.priority}
                      onValueChange={(val) =>
                        handleUpdateTopic(idx, "priority", val)
                      }
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTopic(idx)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION D: MEETING LINK */}
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              <Video className="w-4 h-4 text-primary" />
              <span>Meeting Video Link</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOOGLE_MEET">Google Meet</SelectItem>
                  <SelectItem value="ZOOM">Zoom</SelectItem>
                  <SelectItem value="TEAMS">Microsoft Teams</SelectItem>
                  <SelectItem value="OTHER">Other Provider</SelectItem>
                </SelectContent>
              </Select>

              <div className="sm:col-span-2 relative">
                <Link2 className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION E: REMINDERS & NOTIFICATIONS */}
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-primary" />
              <span>Automated Reminders & Notifications</span>
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 p-2.5 border rounded-lg bg-card cursor-pointer">
                <Checkbox
                  checked={reminderSettings.dailyReminder}
                  onCheckedChange={(c) =>
                    setReminderSettings((prev) => ({
                      ...prev,
                      dailyReminder: !!c,
                    }))
                  }
                />
                <span>Daily reminder before</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 border rounded-lg bg-card cursor-pointer">
                <Checkbox
                  checked={reminderSettings.fifteenMinutesBefore}
                  onCheckedChange={(c) =>
                    setReminderSettings((prev) => ({
                      ...prev,
                      fifteenMinutesBefore: !!c,
                    }))
                  }
                />
                <span>15 minutes before</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 border rounded-lg bg-card cursor-pointer">
                <Checkbox
                  checked={reminderSettings.fiveMinutesBefore}
                  onCheckedChange={(c) =>
                    setReminderSettings((prev) => ({
                      ...prev,
                      fiveMinutesBefore: !!c,
                    }))
                  }
                />
                <span>5 minutes before</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 border rounded-lg bg-card cursor-pointer">
                <Checkbox
                  checked={reminderSettings.meetingStartNotification}
                  onCheckedChange={(c) =>
                    setReminderSettings((prev) => ({
                      ...prev,
                      meetingStartNotification: !!c,
                    }))
                  }
                />
                <span>Meeting-start alert</span>
              </label>
            </div>
          </div>

          {/* SECTION F: ATTACHMENTS (OPTIONAL) */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                <span>Supporting Attachments ({attachments.length})</span>
              </h4>
              {!showAddAttachment && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddAttachment(true)}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Attach Link / File
                </Button>
              )}
            </div>

            {showAddAttachment && (
              <div className="p-3 border rounded-lg bg-muted/20 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Document Title (e.g. Design Spec)"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Document URL (https://...)"
                    value={newAttachmentUrl}
                    onChange={(e) => setNewAttachmentUrl(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddAttachment(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddAttachment}
                    className="h-7 text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded border bg-card text-xs"
                  >
                    <span className="font-medium truncate">{att.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <SheetFooter className="pt-4 border-t flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMeetingMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMeetingMutation.isPending || !title.trim()}
              className="gap-1.5"
            >
              {createMeetingMutation.isPending ? (
                <span>Scheduling...</span>
              ) : (
                <span>Schedule Meeting</span>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default ScheduleMeetingDrawer;
