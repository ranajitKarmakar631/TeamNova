import React, { useState, useEffect } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetOverlay,
  SheetPortal,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Share2,
  Maximize2,
  Minimize2,
  X,
  Copy,
  Check,
  CircleDot,
  Flag,
  User,
  UserCheck,
  Folder,
  Users,
  Calendar as CalendarIcon,
  Building2,
  MinusSquare,
  Pencil,
  Trash2,
  Clock,
  ChevronDown,
  Loader2,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
} from "lucide-react";
import { TaskType, TaskAssigneeType } from "@/types/api.type";
import {
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "@/constant";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetWorkspaceQuery from "@/hooks/api/use-get-workspace";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import {
  editTaskMutationFn,
  deleteTaskMutationFn,
  getProjectMembersQueryFn,
  getAllTeamsQueryFn,
} from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import TaskComments from "./comments/task-comments";
import LexicalEditor from "@/lib/lexical";

interface TaskDetailSheetProps {
  task: TaskType;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_CONFIG: Record<
  TaskStatusEnumType,
  { label: string; dotClass: string }
> = {
  [TaskStatusEnum.BACKLOG]: {
    label: "BACKLOG",
    dotClass: "bg-slate-400",
  },
  [TaskStatusEnum.TODO]: {
    label: "TO DO",
    dotClass: "bg-blue-500",
  },
  [TaskStatusEnum.IN_PROGRESS]: {
    label: "IN PROGRESS",
    dotClass: "bg-amber-500",
  },
  [TaskStatusEnum.IN_REVIEW]: {
    label: "IN REVIEW",
    dotClass: "bg-purple-500",
  },
  [TaskStatusEnum.DONE]: {
    label: "DONE",
    dotClass: "bg-emerald-500",
  },
};

const PRIORITY_CONFIG: Record<
  TaskPriorityEnumType,
  { label: string; colorClass: string; icon: React.ReactNode }
> = {
  [TaskPriorityEnum.LOW]: {
    label: "LOW",
    colorClass: "text-blue-500",
    icon: <ArrowDown className="h-3.5 w-3.5 text-blue-500" />,
  },
  [TaskPriorityEnum.MEDIUM]: {
    label: "MEDIUM",
    colorClass: "text-amber-500",
    icon: <ArrowRight className="h-3.5 w-3.5 text-amber-500" />,
  },
  [TaskPriorityEnum.HIGH]: {
    label: "HIGH",
    colorClass: "text-rose-500",
    icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />,
  },
};

export const TaskDetailSheet: React.FC<TaskDetailSheetProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const [isMaximized, setIsMaximized] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Editable fields state
  const [title, setTitle] = useState(task.title || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [description, setDescription] = useState(task.description || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  // Status & Priority
  const [status, setStatus] = useState<TaskStatusEnumType>(
    (task.status as TaskStatusEnumType) || TaskStatusEnum.TODO
  );
  const [priority, setPriority] = useState<TaskPriorityEnumType>(
    (task.priority as TaskPriorityEnumType) || TaskPriorityEnum.MEDIUM
  );

  // Assignee(s)
  const initialAssignees: TaskAssigneeType[] = Array.isArray(task.assignedTo)
    ? task.assignedTo
    : task.assignedTo
    ? [task.assignedTo]
    : [];
  const [selectedAssignee, setSelectedAssignee] =
    useState<TaskAssigneeType | null>(initialAssignees[0] || null);

  // Due Date
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task.dueDate ? new Date(task.dueDate) : undefined
  );

  // Project & Team
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    task.project?._id || ""
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    task.team?._id || null
  );

  // Sync state when task prop changes
  useEffect(() => {
    setTitle(task.title || "");
    setDescription(task.description || "");
    setStatus((task.status as TaskStatusEnumType) || TaskStatusEnum.TODO);
    setPriority(
      (task.priority as TaskPriorityEnumType) || TaskPriorityEnum.MEDIUM
    );
    const assignees = Array.isArray(task.assignedTo)
      ? task.assignedTo
      : task.assignedTo
      ? [task.assignedTo]
      : [];
    setSelectedAssignee(assignees[0] || null);
    setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    setSelectedProjectId(task.project?._id || "");
    setSelectedTeamId(task.team?._id || null);
  }, [task]);

  // Workspace data
  const { data: workspaceData } = useGetWorkspaceQuery(workspaceId);
  const workspaceName = workspaceData?.workspace?.name || "Workspace";

  // Projects list
  const { data: projectsData } = useGetProjectsInWorkspaceQuery({
    workspaceId,
  });
  const projects = projectsData?.projects || [];
  const currentProject =
    projects.find((p) => p._id === selectedProjectId) || task.project;

  // Teams list
  const { data: teamsData } = useQuery({
    queryKey: ["all-teams", workspaceId],
    queryFn: () => getAllTeamsQueryFn({ workspaceId, pageSize: 50 }),
    enabled: !!workspaceId,
  });
  const teams = teamsData?.teams || [];
  const currentTeam = teams.find((t) => t._id === selectedTeamId) || task.team;

  // Project Members
  const { data: projectMembersData } = useQuery({
    queryKey: ["project-members", workspaceId, selectedProjectId],
    queryFn: () =>
      getProjectMembersQueryFn({
        workspaceId,
        projectId: selectedProjectId,
      }),
    enabled: Boolean(workspaceId && selectedProjectId),
  });
  const rawProjectMembers = projectMembersData?.members || [];
  const availableMembers = rawProjectMembers.map((m: any) => ({
    _id: String(m.user?._id || m.userId || m._id),
    name: m.user?.name || m.name || "Member",
    email: m.user?.email || m.email || "",
    profilePicture: m.user?.profilePicture || m.profilePicture || null,
  }));

  // Creator details
  const creatorName =
    (typeof task.createdBy === "object" && (task.createdBy as any)?.name) ||
    task.reportedTo?.name ||
    "Creator";

  // Mutations
  const { mutateAsync: updateTask, isPending: isUpdating } = useMutation({
    mutationFn: editTaskMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", task._id] });
      toast({
        title: "Success",
        description: "Task updated",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const { mutateAsync: deleteTask, isPending: isDeleting } = useMutation({
    mutationFn: deleteTaskMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      toast({
        title: "Success",
        description: "Task deleted",
        variant: "success",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  // Generic patch helper
  const handleFieldChange = async (updates: Record<string, any>) => {
    try {
      await updateTask({
        taskId: task._id,
        projectId: selectedProjectId || task.project?._id || "",
        workspaceId,
        data: {
          title: updates.title ?? title,
          description: updates.description ?? description,
          status: updates.status ?? status,
          priority: updates.priority ?? priority,
          assignedTo:
            updates.assignedTo !== undefined
              ? updates.assignedTo
              : selectedAssignee
              ? [selectedAssignee._id]
              : [],
          teamId: updates.teamId !== undefined ? updates.teamId : selectedTeamId,
          dueDate:
            updates.dueDate !== undefined
              ? updates.dueDate
                ? updates.dueDate.toISOString()
                : null
              : dueDate
              ? dueDate.toISOString()
              : null,
        },
      });
    } catch {
      // Handled in onError
    }
  };

  const handleCopyTaskCode = () => {
    if (task.taskCode) {
      navigator.clipboard.writeText(task.taskCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1600);
    }
  };

  const handleShareTask = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Task link copied to clipboard",
      variant: "success",
    });
  };

  const handleDeleteTask = async () => {
    if (
      confirm(
        `Are you sure you want to permanently delete task "${task.title}"?`
      )
    ) {
      await deleteTask({
        workspaceId,
        taskId: task._id,
      });
    }
  };

  const handleSaveTitle = async () => {
    setIsEditingTitle(false);
    if (title.trim() && title.trim() !== task.title) {
      await handleFieldChange({ title: title.trim() });
    } else {
      setTitle(task.title);
    }
  };

  const handleSaveDescription = async () => {
    setIsEditingDesc(false);
    if (description !== task.description) {
      await handleFieldChange({ description });
    }
  };

  // Render markdown description text safely with code blocks & formatting
  const renderFormattedDescription = (text: string) => {
    if (!text) {
      return (
        <p className="text-xs text-muted-foreground italic">
          No description provided. Click to add details...
        </p>
      );
    }

    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Code block lines or blockquotes
      if (line.startsWith("Error:") || line.startsWith("```")) {
        return (
          <div
            key={idx}
            className="my-1.5 p-2.5 rounded-md bg-muted/60 font-mono text-[11px] text-foreground/90 border border-border/50 overflow-x-auto"
          >
            {line.replace(/```/g, "")}
          </div>
        );
      }
      // Bullets
      if (line.trim().startsWith("•") || line.trim().startsWith("-") || line.trim().startsWith("*")) {
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 text-xs">
            <span className="text-primary font-bold">•</span>
            <span>{line.replace(/^[•\-*]\s*/, "")}</span>
          </div>
        );
      }
      // Headings
      if (line.startsWith("#")) {
        return (
          <h4 key={idx} className="font-semibold text-xs text-foreground mt-2 mb-1">
            {line.replace(/^#+\s*/, "")}
          </h4>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs text-foreground/90 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetPortal>
        <SheetOverlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <SheetContent
          side="right"
          className={`fixed inset-y-0 right-0 z-50 h-full bg-background p-0 shadow-2xl transition-all duration-300 ease-in-out border-l border-border/70 flex flex-col ${
            isMaximized
              ? "w-full sm:max-w-4xl lg:max-w-5xl"
              : "w-full sm:max-w-xl md:max-w-2xl lg:max-w-[700px]"
          }`}
        >
          {/* 1. TOP HEADER BAR */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-border/60 shrink-0 bg-card/40">
            {/* Breadcrumb info */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleCopyTaskCode}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/70 bg-muted/40 font-mono text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Click to copy task code"
              >
                <span>{task.taskCode || "TASK"}</span>
                {copiedCode ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
              <span className="text-muted-foreground/50">/</span>
              <span className="font-medium text-muted-foreground truncate max-w-[160px]">
                {workspaceName}
              </span>
            </div>

            {/* Actions: Share, Maximize, Close */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleShareTask}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                title="Share task"
              >
                <Share2 className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsMaximized((prev) => !prev)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hidden sm:flex"
                title={isMaximized ? "Restore size" : "Maximize drawer"}
              >
                {isMaximized ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 2. SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Task Title */}
            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle();
                      if (e.key === "Escape") {
                        setTitle(task.title);
                        setIsEditingTitle(false);
                      }
                    }}
                    autoFocus
                    className="text-lg md:text-xl font-bold tracking-tight h-auto py-1.5 px-2 bg-muted/40"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveTitle}
                    className="h-8 text-xs shrink-0"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <h2
                  onClick={() => setIsEditingTitle(true)}
                  className="text-lg md:text-xl font-bold tracking-tight text-foreground hover:bg-muted/30 rounded-md py-1 px-1 -mx-1 cursor-text transition-colors flex items-center justify-between group"
                  title="Click to edit title"
                >
                  <span>{title}</span>
                  <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 text-muted-foreground shrink-0 ml-2" />
                </h2>
              )}
            </div>

            {/* PROPERTIES 2-COLUMN GRID */}
            <div className="rounded-xl border border-border/70 bg-card/50 p-4 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {/* Column 1 */}
                <div className="space-y-3.5">
                  {/* Status Dropdown */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
                      <CircleDot className="h-3 w-3" />
                      <span>Status</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-muted/40 text-xs font-semibold text-foreground transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                STATUS_CONFIG[status]?.dotClass || "bg-slate-400"
                              }`}
                            />
                            <span>{STATUS_CONFIG[status]?.label || status}</span>
                          </div>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {Object.values(TaskStatusEnum).map((st) => (
                          <DropdownMenuItem
                            key={st}
                            onClick={() => {
                              setStatus(st);
                              handleFieldChange({ status: st });
                            }}
                            className="flex items-center gap-2 text-xs cursor-pointer font-medium"
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${STATUS_CONFIG[st].dotClass}`}
                            />
                            <span>{STATUS_CONFIG[st].label}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Assigned To Dropdown */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
                      <User className="h-3 w-3" />
                      <span>Assigned To</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-muted/40 text-xs font-medium text-foreground transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {selectedAssignee ? (
                              <>
                                <Avatar className="h-5 w-5 text-[9px]">
                                  {selectedAssignee.profilePicture && (
                                    <AvatarImage
                                      src={selectedAssignee.profilePicture}
                                      alt={selectedAssignee.name}
                                    />
                                  )}
                                  <AvatarFallback
                                    className={`${getAvatarColor(
                                      selectedAssignee.name
                                    )} text-white font-medium`}
                                  >
                                    {getAvatarFallbackText(
                                      selectedAssignee.name
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate">
                                  {selectedAssignee.name}
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">
                                Unassigned
                              </span>
                            )}
                          </div>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56 max-h-60 overflow-y-auto">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAssignee(null);
                            handleFieldChange({ assignedTo: [] });
                          }}
                          className="text-xs text-muted-foreground cursor-pointer"
                        >
                          Unassigned
                        </DropdownMenuItem>
                        {availableMembers.map((member) => (
                          <DropdownMenuItem
                            key={member._id}
                            onClick={() => {
                              const newAssignee = {
                                _id: member._id,
                                name: member.name,
                                profilePicture: member.profilePicture,
                              };
                              setSelectedAssignee(newAssignee);
                              handleFieldChange({
                                assignedTo: [member._id],
                              });
                            }}
                            className="flex items-center gap-2 text-xs cursor-pointer font-medium"
                          >
                            <Avatar className="h-5 w-5 text-[9px]">
                              {member.profilePicture && (
                                <AvatarImage
                                  src={member.profilePicture}
                                  alt={member.name}
                                />
                              )}
                              <AvatarFallback
                                className={`${getAvatarColor(
                                  member.name
                                )} text-white`}
                              >
                                {getAvatarFallbackText(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{member.name}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Project Dropdown */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
                      <Folder className="h-3 w-3" />
                      <span>Project</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-muted/40 text-xs font-medium text-foreground transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="h-2 w-2 rounded-full bg-indigo-500" />
                            <span className="truncate">
                              {currentProject?.name || "Select Project"}
                            </span>
                          </div>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-52">
                        {projects.map((proj) => (
                          <DropdownMenuItem
                            key={proj._id}
                            onClick={() => {
                              setSelectedProjectId(proj._id);
                            }}
                            className="flex items-center gap-2 text-xs cursor-pointer font-medium"
                          >
                            <span>{proj.emoji || "📁"}</span>
                            <span className="truncate">{proj.name}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Due Date Popover */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>Due Date</span>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-muted/40 text-xs font-medium text-foreground transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 text-xs">
                            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>
                              {dueDate ? format(dueDate, "PPP") : "No due date"}
                            </span>
                          </div>
                          <Pencil className="h-3 w-3 text-muted-foreground/60" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={(date) => {
                            setDueDate(date);
                            handleFieldChange({ dueDate: date });
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-3.5">
                  {/* Priority Dropdown */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
                      <Flag className="h-3 w-3" />
                      <span>Priority</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-muted/40 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            {PRIORITY_CONFIG[priority]?.icon}
                            <span className={PRIORITY_CONFIG[priority]?.colorClass}>
                              {PRIORITY_CONFIG[priority]?.label || priority}
                            </span>
                          </div>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44">
                        {Object.values(TaskPriorityEnum).map((pr) => (
                          <DropdownMenuItem
                            key={pr}
                            onClick={() => {
                              setPriority(pr);
                              handleFieldChange({ priority: pr });
                            }}
                            className="flex items-center gap-2 text-xs cursor-pointer font-semibold"
                          >
                            {PRIORITY_CONFIG[pr].icon}
                            <span className={PRIORITY_CONFIG[pr].colorClass}>
                              {PRIORITY_CONFIG[pr].label}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Created By Card */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
                      <UserCheck className="h-3 w-3" />
                      <span>Created By</span>
                    </div>
                    <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/20 text-xs font-medium text-foreground">
                      <Avatar className="h-5 w-5 text-[9px]">
                        <AvatarFallback
                          className={`${getAvatarColor(creatorName)} text-white font-medium`}
                        >
                          {getAvatarFallbackText(creatorName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{creatorName}</span>
                    </div>
                  </div>

                  {/* Team Dropdown */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
                      <Users className="h-3 w-3" />
                      <span>Team</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-muted/40 text-xs font-medium text-foreground transition-colors cursor-pointer"
                        >
                          <span className="font-mono text-xs text-primary truncate">
                            {currentTeam?.slug || currentTeam?.name || "General"}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTeamId(null);
                            handleFieldChange({ teamId: null });
                          }}
                          className="text-xs text-muted-foreground cursor-pointer"
                        >
                          None (General)
                        </DropdownMenuItem>
                        {teams.map((t) => (
                          <DropdownMenuItem
                            key={t._id}
                            onClick={() => {
                              setSelectedTeamId(t._id);
                              handleFieldChange({ teamId: t._id });
                            }}
                            className="text-xs cursor-pointer font-mono font-medium"
                          >
                            {t.slug || t.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Workspace Card */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
                      <Building2 className="h-3 w-3" />
                      <span>Workspace</span>
                    </div>
                    <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/20 text-xs font-medium text-foreground">
                      <span className="truncate">{workspaceName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DESCRIPTION SECTION */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <MinusSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Description</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Markdown supported
                </span>
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  <LexicalEditor
                    value={description}
                    onChange={(md) => setDescription(md)}
                    placeholder="Add a detailed description for this task... (Type @ to mention)"
                    mentionOptions={availableMembers.map((m) => ({
                      id: m._id,
                      name: m.name,
                      email: m.email,
                      avatar: m.profilePicture,
                    }))}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDescription(task.description || "");
                        setIsEditingDesc(false);
                      }}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveDescription}
                      disabled={isUpdating}
                      className="h-7 text-xs"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="rounded-xl border border-border/70 bg-card/40 p-4 hover:border-border transition-colors cursor-text min-h-[90px] shadow-xs group relative"
                  title="Click to edit description"
                >
                  <Pencil className="absolute right-3 top-3 h-3.5 w-3.5 opacity-0 group-hover:opacity-60 text-muted-foreground transition-opacity" />
                  {renderFormattedDescription(description)}
                </div>
              )}
            </div>

            {/* TIMESTAMPS FOOTER */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  Created{" "}
                  {task.createdAt
                    ? formatDistanceToNowStrict(new Date(task.createdAt), {
                        addSuffix: true,
                      })
                    : "recently"}
                </span>
              </div>
              <div>
                <span>
                  Updated{" "}
                  {task.updatedAt
                    ? formatDistanceToNowStrict(new Date(task.updatedAt), {
                        addSuffix: true,
                      })
                    : "just now"}{" "}
                  by {creatorName}
                </span>
              </div>
            </div>

            {/* 3. ACTIVITY & COMMENTS SECTION */}
            <div className="pt-2">
              <TaskComments
                taskId={task._id}
                projectId={selectedProjectId}
                members={availableMembers}
              />
            </div>
          </div>

          {/* 4. BOTTOM ACTION FOOTER */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/60 bg-card/40 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 p-0 h-auto"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>Delete task</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={onClose}
              className="h-8 px-4 text-xs font-semibold"
            >
              Done
            </Button>
          </div>
        </SheetContent>
      </SheetPortal>
    </Sheet>
  );
};

export default TaskDetailSheet;
