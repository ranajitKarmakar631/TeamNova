import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Globe,
  Video,
  XCircle,
  Play,
  CheckCircle,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  X,
  AlertCircle,
  ArrowRight,
  Lock,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import LexicalEditor from "@/lib/lexical/LexicalEditor";
import {
  useGetMeetingByIdQuery,
  useGetMeetingActivitiesQuery,
  useStartMeetingMutation,
  useCompleteMeetingMutation,
  useCancelMeetingMutation,
  useRsvpMeetingMutation,
  useRecordAttendanceMutation,
  useCreateTopicMutation,
  useReviewTopicMutation,
  useDeleteTopicMutation,
  useFinalizeAgendaMutation,
  useUpsertMinutesMutation,
  useCreateActionItemMutation,
  useConvertActionItemToTaskMutation,
  useAddParticipantsMutation,
  useRemoveParticipantMutation,
  IMeetingActionItem,
  TopicPriorityType,
  ActionItemPriorityType,
} from "@/features/meeting";
import useProjectsQuery from "@/features/project/hooks/use-projects";
import useWorkspaceMembersQuery from "@/features/member/hooks/use-workspace-members";
import { useAuthContext } from "@/context/auth-provider";

interface MeetingDetailsDrawerProps {
  workspaceId: string;
  meetingId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MeetingDetailsDrawer: React.FC<MeetingDetailsDrawerProps> = ({
  workspaceId,
  meetingId,
  isOpen,
  onClose,
}) => {
  const { user } = useAuthContext();
  const currentUserId = user?._id || "";

  const [activeTab, setActiveTab] = useState("overview");

  // Topic creation modal/state
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [topicPriority, setTopicPriority] = useState<TopicPriorityType>("MEDIUM");

  // Minutes state
  const [minutesSummary, setMinutesSummary] = useState("");
  const [decisions, setDecisions] = useState<string[]>([]);
  const [unresolvedIssues, setUnresolvedIssues] = useState<string[]>([]);
  const [newDecision, setNewDecision] = useState("");
  const [newIssue, setNewIssue] = useState("");
  const [minutesInitialized, setMinutesInitialized] = useState(false);

  // Action item creation
  const [showAddActionItem, setShowAddActionItem] = useState(false);
  const [actionTitle, setActionTitle] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [actionPriority, setActionPriority] = useState<ActionItemPriorityType>("MEDIUM");
  const [actionAssignee, setActionAssignee] = useState("");
  const [actionDueAt, setActionDueAt] = useState("");

  // Convert to task dialog
  const [convertingActionItem, setConvertingActionItem] = useState<IMeetingActionItem | null>(null);
  const [selectedTaskProject, setSelectedTaskProject] = useState("");

  // Cancel dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Add Participant
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedNewUserIds, setSelectedNewUserIds] = useState<string[]>([]);

  // Fetch meeting data
  const { data, isLoading } = useGetMeetingByIdQuery(
    workspaceId,
    meetingId || ""
  );
  const { data: activitiesData } = useGetMeetingActivitiesQuery(
    workspaceId,
    meetingId || ""
  );

  const { data: projectsData } = useProjectsQuery({ workspaceId });
  const { data: membersData } = useWorkspaceMembersQuery(workspaceId);

  const projects = projectsData?.projects || [];
  const members = membersData?.members || [];

  // Mutations
  const startMutation = useStartMeetingMutation(workspaceId, meetingId || "");
  const completeMutation = useCompleteMeetingMutation(workspaceId, meetingId || "");
  const cancelMutation = useCancelMeetingMutation(workspaceId, meetingId || "");
  const rsvpMutation = useRsvpMeetingMutation(workspaceId, meetingId || "");
  const attendanceMutation = useRecordAttendanceMutation(workspaceId, meetingId || "");
  const createTopicMutation = useCreateTopicMutation(workspaceId, meetingId || "");
  const reviewTopicMutation = useReviewTopicMutation(workspaceId, meetingId || "");
  const deleteTopicMutation = useDeleteTopicMutation(workspaceId, meetingId || "");
  const finalizeAgendaMutation = useFinalizeAgendaMutation(workspaceId, meetingId || "");
  const upsertMinutesMutation = useUpsertMinutesMutation(workspaceId, meetingId || "");
  const createActionItemMutation = useCreateActionItemMutation(workspaceId, meetingId || "");
  const convertTaskMutation = useConvertActionItemToTaskMutation(workspaceId, meetingId || "");
  const addParticipantsMutation = useAddParticipantsMutation(workspaceId, meetingId || "");
  const removeParticipantMutation = useRemoveParticipantMutation(workspaceId, meetingId || "");

  const meeting = data?.meeting;
  const participants = data?.participants || [];
  const topics = data?.topics || [];
  const minutes = data?.minutes;
  const actionItems = data?.actionItems || [];
  const activities = activitiesData?.activities || [];
  const currentParticipant = data?.currentParticipant;

  // Initialize minutes state once loaded
  if (minutes && !minutesInitialized) {
    setMinutesSummary(minutes.summary || "");
    setDecisions(minutes.decisions || []);
    setUnresolvedIssues(minutes.unresolvedIssues || []);
    setMinutesInitialized(true);
  }

  const isOrganizer = meeting?.organizerId?._id === currentUserId;
  const isCoOrganizer = meeting?.coOrganizerIds?.some((c) => c._id === currentUserId);
  const canManage = isOrganizer || isCoOrganizer;

  const handleStart = () => startMutation.mutate();
  const handleComplete = () => completeMutation.mutate();
  const handleCancel = () => {
    cancelMutation.mutate(cancelReason, {
      onSuccess: () => setShowCancelDialog(false),
    });
  };

  const handleJoin = () => {
    if (meeting?.meetingLink) {
      // Record joined attendance
      attendanceMutation.mutate({ attendanceStatus: "JOINED" });
      window.open(meeting.meetingLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleAddTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim()) return;
    createTopicMutation.mutate(
      {
        title: topicTitle.trim(),
        description: topicDescription,
        priority: topicPriority,
      },
      {
        onSuccess: () => {
          setShowAddTopic(false);
          setTopicTitle("");
          setTopicDescription("");
        },
      }
    );
  };

  const handleAddActionItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim()) return;
    createActionItemMutation.mutate(
      {
        title: actionTitle.trim(),
        description: actionDescription,
        priority: actionPriority,
        assignedTo: actionAssignee || null,
        dueAt: actionDueAt ? new Date(actionDueAt).toISOString() : null,
      },
      {
        onSuccess: () => {
          setShowAddActionItem(false);
          setActionTitle("");
          setActionDescription("");
          setActionAssignee("");
          setActionDueAt("");
        },
      }
    );
  };

  const handleSaveMinutes = () => {
    upsertMinutesMutation.mutate({
      summary: minutesSummary,
      decisions,
      unresolvedIssues,
    });
  };

  const handleConvertActionItemToTask = () => {
    if (!convertingActionItem || !selectedTaskProject) return;
    convertTaskMutation.mutate(
      {
        actionItemId: convertingActionItem._id,
        data: {
          projectId: selectedTaskProject,
          title: convertingActionItem.title,
          description: convertingActionItem.description,
          priority: convertingActionItem.priority,
        },
      },
      {
        onSuccess: () => {
          setConvertingActionItem(null);
          setSelectedTaskProject("");
        },
      }
    );
  };

  const handleAddMembersSubmit = () => {
    if (selectedNewUserIds.length === 0) return;
    addParticipantsMutation.mutate(
      { userIds: selectedNewUserIds },
      {
        onSuccess: () => {
          setShowAddMember(false);
          setSelectedNewUserIds([]);
        },
      }
    );
  };

  if (!isOpen || !meetingId) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-3xl md:max-w-4xl overflow-y-auto p-6 flex flex-col gap-6"
        >
          {isLoading || !meeting ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="pb-4 border-b space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        meeting.status === "SCHEDULED"
                          ? "default"
                          : meeting.status === "IN_PROGRESS"
                          ? "destructive"
                          : meeting.status === "COMPLETED"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs uppercase font-semibold"
                    >
                      {meeting.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {meeting.audience}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {meeting.meetingLink && meeting.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        onClick={handleJoin}
                        className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Meeting</span>
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                      </Button>
                    )}

                    {canManage && meeting.status === "SCHEDULED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStart}
                        className="gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start</span>
                      </Button>
                    )}

                    {canManage && meeting.status === "IN_PROGRESS" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleComplete}
                        className="gap-1 text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </Button>
                    )}

                    {canManage && meeting.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCancelDialog(true)}
                        className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </Button>
                    )}
                  </div>
                </div>

                <SheetTitle className="text-2xl font-bold tracking-tight">
                  {meeting.title}
                </SheetTitle>

                {/* Subheader Metadata */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {new Date(meeting.startAt).toLocaleDateString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {new Date(meeting.startAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(meeting.endAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <span>{meeting.timezone}</span>
                  </div>

                  {meeting.meetingLink && (
                    <div className="flex items-center gap-1.5 text-blue-500 hover:underline">
                      <Video className="w-3.5 h-3.5" />
                      <a href={meeting.meetingLink} target="_blank" rel="noreferrer">
                        {meeting.meetingProvider || "Meeting Link"}
                      </a>
                    </div>
                  )}
                </div>

                {/* Current User RSVP Status Bar */}
                {currentParticipant && meeting.status === "SCHEDULED" && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Your RSVP status:</span>
                      <Badge variant="outline" className="font-semibold text-xs uppercase">
                        {currentParticipant.invitationStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={currentParticipant.invitationStatus === "ACCEPTED" ? "default" : "outline"}
                        onClick={() => rsvpMutation.mutate({ status: "ACCEPTED" })}
                        className="h-7 text-xs"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant={currentParticipant.invitationStatus === "TENTATIVE" ? "default" : "outline"}
                        onClick={() => rsvpMutation.mutate({ status: "TENTATIVE" })}
                        className="h-7 text-xs"
                      >
                        Tentative
                      </Button>
                      <Button
                        size="sm"
                        variant={currentParticipant.invitationStatus === "DECLINED" ? "destructive" : "outline"}
                        onClick={() => rsvpMutation.mutate({ status: "DECLINED" })}
                        className="h-7 text-xs"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="overview" className="text-xs">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="agenda" className="text-xs">
                    Agenda ({topics.length})
                  </TabsTrigger>
                  <TabsTrigger value="participants" className="text-xs">
                    Participants ({participants.length})
                  </TabsTrigger>
                  <TabsTrigger value="minutes" className="text-xs">
                    Minutes & Actions
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs">
                    Activity
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: OVERVIEW */}
                <TabsContent value="overview" className="space-y-5">
                  {/* Meeting Agenda / Description */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Meeting Agenda</h4>
                    <div className="p-4 rounded-lg border bg-card text-sm">
                      {meeting.description ? (
                        <LexicalEditor
                          value={meeting.description}
                          readOnly={true}
                          showToolbar={false}
                        />
                      ) : (
                        <p className="text-muted-foreground italic text-xs">
                          No description provided for this meeting.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Discussion Topics Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">
                        Discussion Topics ({topics.length})
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("agenda")}
                        className="text-xs text-primary h-7 gap-1"
                      >
                        View all <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {topics.slice(0, 3).map((topic, i) => (
                        <div
                          key={topic._id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 font-semibold text-muted-foreground">
                              {i + 1}.
                            </span>
                            <div>
                              <p className="font-medium text-foreground">{topic.title}</p>
                              {topic.description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-1">
                                  {topic.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                topic.priority === "HIGH"
                                  ? "destructive"
                                  : topic.priority === "MEDIUM"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-[10px]"
                            >
                              {topic.priority}
                            </Badge>
                            {topic.assignedTo && (
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={topic.assignedTo.profilePicture} />
                                  <AvatarFallback className="text-[9px]">
                                    {topic.assignedTo.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{topic.assignedTo.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Organizer & Reminders Details Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Organizer
                      </h4>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border">
                          <AvatarImage src={meeting.organizerId.profilePicture} />
                          <AvatarFallback>
                            {meeting.organizerId.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{meeting.organizerId.name}</p>
                          <p className="text-xs text-muted-foreground">{meeting.organizerId.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Meeting Details
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        <p className="text-muted-foreground flex justify-between">
                          <span>Audience:</span>
                          <span className="font-medium text-foreground">{meeting.audience}</span>
                        </p>
                        <p className="text-muted-foreground flex justify-between">
                          <span>Reminders:</span>
                          <span className="font-medium text-foreground">
                            {[
                              meeting.reminderSettings.dailyReminder ? "Daily" : null,
                              meeting.reminderSettings.fifteenMinutesBefore ? "15m" : null,
                              meeting.reminderSettings.fiveMinutesBefore ? "5m" : null,
                            ]
                              .filter(Boolean)
                              .join(" & ") || "None"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Green Reminder Banner */}
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Meeting reminder set! You'll receive automated notifications before the meeting.</span>
                  </div>
                </TabsContent>

                {/* TAB 2: COLLABORATIVE AGENDA */}
                <TabsContent value="agenda" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Collaborative Agenda
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {meeting.isAgendaFinalized
                          ? "Agenda has been finalized."
                          : "Participants can submit topics for discussion."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {canManage && !meeting.isAgendaFinalized && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => finalizeAgendaMutation.mutate()}
                          className="h-8 text-xs gap-1 border-primary/40 text-primary"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Finalize Agenda
                        </Button>
                      )}

                      {!meeting.isAgendaFinalized && (
                        <Button
                          size="sm"
                          onClick={() => setShowAddTopic(true)}
                          className="h-8 text-xs gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Topic
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Topic Add Form */}
                  {showAddTopic && (
                    <form
                      onSubmit={handleAddTopicSubmit}
                      className="p-4 rounded-lg border bg-muted/20 space-y-3 text-xs"
                    >
                      <h5 className="font-semibold text-sm">Submit New Topic</h5>
                      <div className="space-y-1">
                        <Label className="text-xs">Topic Title</Label>
                        <Input
                          placeholder="e.g. Database Index Optimization"
                          value={topicTitle}
                          onChange={(e) => setTopicTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description (Optional)</Label>
                        <Input
                          placeholder="Details or notes about this topic..."
                          value={topicDescription}
                          onChange={(e) => setTopicDescription(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Priority:</Label>
                          <Select
                            value={topicPriority}
                            onValueChange={(val: any) => setTopicPriority(val)}
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
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAddTopic(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" size="sm">
                            Submit
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Topics List */}
                  <div className="space-y-2.5">
                    {topics.length === 0 ? (
                      <p className="text-center text-muted-foreground text-xs py-8 italic border rounded-lg">
                        No discussion topics added yet. Click &quot;Add Topic&quot; to propose one.
                      </p>
                    ) : (
                      topics.map((topic, i) => (
                        <div
                          key={topic._id}
                          className="p-3.5 rounded-lg border bg-card space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="font-bold text-muted-foreground mt-0.5">
                                {i + 1}.
                              </span>
                              <div>
                                <h5 className="font-semibold text-foreground text-sm">
                                  {topic.title}
                                </h5>
                                {topic.description && (
                                  <p className="text-muted-foreground mt-0.5">
                                    {topic.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  topic.status === "APPROVED"
                                    ? "default"
                                    : topic.status === "REJECTED"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-[10px]"
                              >
                                {topic.status}
                              </Badge>

                              <Badge
                                variant={
                                  topic.priority === "HIGH"
                                    ? "destructive"
                                    : topic.priority === "MEDIUM"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-[10px]"
                              >
                                {topic.priority}
                              </Badge>

                              {/* Organizer Review Actions */}
                              {canManage && topic.status === "SUBMITTED" && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      reviewTopicMutation.mutate({
                                        topicId: topic._id,
                                        status: "APPROVED",
                                      })
                                    }
                                    className="h-6 px-2 text-[10px] text-emerald-600"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      reviewTopicMutation.mutate({
                                        topicId: topic._id,
                                        status: "REJECTED",
                                      })
                                    }
                                    className="h-6 px-2 text-[10px] text-destructive"
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}

                              {(canManage || topic.createdBy._id === currentUserId) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteTopicMutation.mutate(topic._id)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
                            <span>Submitted by: {topic.createdBy.name}</span>
                            {topic.assignedTo && (
                              <span>Assigned to: {topic.assignedTo.name}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* TAB 3: PARTICIPANTS */}
                <TabsContent value="participants" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Participants ({participants.length})
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Manage invitations, roles, and meeting attendance.
                      </p>
                    </div>

                    {canManage && (
                      <Button
                        size="sm"
                        onClick={() => setShowAddMember(true)}
                        className="h-8 text-xs gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Member
                      </Button>
                    )}
                  </div>

                  {/* Add Member inline form */}
                  {showAddMember && (
                    <div className="p-3 border rounded-lg bg-muted/20 space-y-2 text-xs">
                      <Label className="font-semibold">Select Workspace Members to Invite</Label>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {members.map((m: any) => {
                          const u = m.userId;
                          if (!u) return null;
                          const isAlreadyInvited = participants.some((p) => p.userId._id === u._id);
                          if (isAlreadyInvited) return null;
                          const isSelected = selectedNewUserIds.includes(u._id);
                          return (
                            <div
                              key={u._id}
                              onClick={() =>
                                setSelectedNewUserIds((prev) =>
                                  isSelected ? prev.filter((id) => id !== u._id) : [...prev, u._id]
                                )
                              }
                              className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                                isSelected ? "bg-primary/10" : "hover:bg-muted/40"
                              }`}
                            >
                              <span>{u.name} ({u.email})</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAddMember(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAddMembersSubmit}
                          disabled={selectedNewUserIds.length === 0}
                        >
                          Add Selected
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Participants List */}
                  <div className="divide-y divide-border rounded-lg border bg-card">
                    {participants.map((p) => (
                      <div
                        key={p._id}
                        className="flex items-center justify-between p-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={p.userId?.profilePicture} />
                            <AvatarFallback>{p.userId?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">{p.userId?.name}</p>
                            <p className="text-[11px] text-muted-foreground">{p.userId?.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {p.role}
                          </Badge>

                          <Badge
                            variant={
                              p.invitationStatus === "ACCEPTED"
                                ? "default"
                                : p.invitationStatus === "DECLINED"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {p.invitationStatus}
                          </Badge>

                          {canManage && p.userId?._id !== meeting.organizerId._id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeParticipantMutation.mutate(p.userId._id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* TAB 4: MINUTES & ACTION ITEMS */}
                <TabsContent value="minutes" className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">
                        Meeting Summary
                      </h4>
                      {canManage && (
                        <Button
                          size="sm"
                          onClick={handleSaveMinutes}
                          disabled={upsertMinutesMutation.isPending}
                          className="h-7 text-xs"
                        >
                          Save Minutes
                        </Button>
                      )}
                    </div>

                    <div className="border rounded-md bg-background overflow-hidden">
                      <LexicalEditor
                        value={minutesSummary}
                        onChange={setMinutesSummary}
                        outputFormat="markdown"
                        placeholder="Document key meeting takeaways, summary notes, and decisions..."
                        readOnly={!canManage}
                        showToolbar={canManage}
                        className="min-h-[140px]"
                      />
                    </div>
                  </div>

                  {/* Decisions & Unresolved Issues */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Decisions */}
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <h5 className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Recorded Decisions ({decisions.length})
                      </h5>

                      {canManage && (
                        <div className="flex items-center gap-1.5">
                          <Input
                            placeholder="Add decision..."
                            value={newDecision}
                            onChange={(e) => setNewDecision(e.target.value)}
                            className="h-7 text-xs"
                          />
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => {
                              if (newDecision.trim()) {
                                setDecisions((prev) => [...prev, newDecision.trim()]);
                                setNewDecision("");
                              }
                            }}
                            className="h-7 text-xs"
                          >
                            Add
                          </Button>
                        </div>
                      )}

                      <ul className="space-y-1.5 text-xs">
                        {decisions.map((dec, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between p-1.5 rounded bg-muted/30"
                          >
                            <span>• {dec}</span>
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setDecisions((prev) => prev.filter((_, idx) => idx !== i))
                                }
                                className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Unresolved Issues */}
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <h5 className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        Unresolved Issues ({unresolvedIssues.length})
                      </h5>

                      {canManage && (
                        <div className="flex items-center gap-1.5">
                          <Input
                            placeholder="Add issue..."
                            value={newIssue}
                            onChange={(e) => setNewIssue(e.target.value)}
                            className="h-7 text-xs"
                          />
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => {
                              if (newIssue.trim()) {
                                setUnresolvedIssues((prev) => [...prev, newIssue.trim()]);
                                setNewIssue("");
                              }
                            }}
                            className="h-7 text-xs"
                          >
                            Add
                          </Button>
                        </div>
                      )}

                      <ul className="space-y-1.5 text-xs">
                        {unresolvedIssues.map((issue, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between p-1.5 rounded bg-muted/30"
                          >
                            <span>• {issue}</span>
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setUnresolvedIssues((prev) => prev.filter((_, idx) => idx !== i))
                                }
                                className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Items & Convert to Task */}
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Action Items ({actionItems.length})
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Track outcomes and convert them to project tasks.
                        </p>
                      </div>

                      {canManage && (
                        <Button
                          size="sm"
                          onClick={() => setShowAddActionItem(true)}
                          className="h-8 text-xs gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Action Item
                        </Button>
                      )}
                    </div>

                    {/* Add action item form */}
                    {showAddActionItem && (
                      <form
                        onSubmit={handleAddActionItemSubmit}
                        className="p-3.5 border rounded-lg bg-muted/20 space-y-3 text-xs"
                      >
                        <h5 className="font-semibold text-sm">New Action Item</h5>
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input
                            placeholder="What needs to be done?"
                            value={actionTitle}
                            onChange={(e) => setActionTitle(e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Priority</Label>
                            <Select
                              value={actionPriority}
                              onValueChange={(val: any) => setActionPriority(val)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Assignee</Label>
                            <Select
                              value={actionAssignee}
                              onValueChange={setActionAssignee}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Assignee" />
                              </SelectTrigger>
                              <SelectContent>
                                {participants.map((p) => (
                                  <SelectItem key={p.userId._id} value={p.userId._id}>
                                    {p.userId.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Due Date</Label>
                            <Input
                              type="date"
                              value={actionDueAt}
                              onChange={(e) => setActionDueAt(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAddActionItem(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" size="sm">
                            Add Action Item
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Action Items List */}
                    <div className="space-y-2">
                      {actionItems.length === 0 ? (
                        <p className="text-center text-muted-foreground text-xs py-6 italic border rounded-lg">
                          No action items recorded yet.
                        </p>
                      ) : (
                        actionItems.map((item) => (
                          <div
                            key={item._id}
                            className="p-3 rounded-lg border bg-card flex flex-wrap items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground text-sm">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Badge variant="outline" className="text-[10px]">
                                  {item.priority}
                                </Badge>
                                {item.assignedTo && (
                                  <span>Assigned to: {item.assignedTo.name}</span>
                                )}
                                {item.dueAt && (
                                  <span>
                                    Due: {new Date(item.dueAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {item.status === "CONVERTED_TO_TASK" ? (
                                <Badge variant="default" className="text-[10px] bg-emerald-600 gap-1">
                                  <Check className="w-3 h-3" />
                                  Converted to Task
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setConvertingActionItem(item);
                                    if (meeting.projectId?._id) {
                                      setSelectedTaskProject(meeting.projectId._id);
                                    }
                                  }}
                                  className="h-7 text-xs gap-1 border-primary/40 text-primary"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  Convert to Task
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 5: ACTIVITY TIMELINE */}
                <TabsContent value="activity" className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">
                      Meeting Activity History
                    </h4>

                    {activities.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-6 text-center border rounded-lg">
                        No activity recorded yet.
                      </p>
                    ) : (
                      <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60 pl-6">
                        {activities.map((act) => (
                          <div key={act._id} className="relative text-xs space-y-0.5">
                            <span className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-primary" />
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground">
                                {act.actorId?.name || "Member"}
                              </span>
                              <span className="text-muted-foreground">
                                {act.action.replace(/_/g, " ").toLowerCase()}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(act.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Convert to Task Modal */}
      <Dialog
        open={!!convertingActionItem}
        onOpenChange={(open) => !open && setConvertingActionItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convert Action Item to Project Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              This will create a new task directly inside the selected project using TaskNova&apos;s task system.
            </p>
            <div className="p-2.5 rounded border bg-muted/30">
              <span className="font-semibold text-foreground">
                {convertingActionItem?.title}
              </span>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Destination Project</Label>
              <Select
                value={selectedTaskProject}
                onValueChange={setSelectedTaskProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Project..." />
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
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConvertingActionItem(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!selectedTaskProject || convertTaskMutation.isPending}
              onClick={handleConvertActionItemToTask}
            >
              Convert to Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Meeting Confirmation Dialog */}
      <Dialog
        open={showCancelDialog}
        onOpenChange={(open) => !open && setShowCancelDialog(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Cancel Meeting
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2 text-xs">
            <p className="text-muted-foreground">
              Are you sure you want to cancel this meeting? All participants will receive a cancellation notification.
            </p>
            <Label className="text-xs">Reason for cancellation (optional)</Label>
            <Input
              placeholder="e.g. Rescheduled due to conflicts..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Meeting
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={cancelMutation.isPending}
              onClick={handleCancel}
            >
              Yes, Cancel Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MeetingDetailsDrawer;
