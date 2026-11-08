import { useEffect, useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  CalendarIcon,
  ChevronsUpDown,
  Loader,
  ShieldAlert,
  User,
  Users,
  X,
  UserCheck,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "../../ui/textarea";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  getAvatarColor,
  getAvatarFallbackText,
  transformOptions,
} from "@/lib/helper";
import useWorkspaceId from "@/hooks/use-workspace-id";
import {
  AssociationRoles,
  TaskPriorityEnum,
  TaskStatusEnum,
  TaskStatusEnumType,
  WorkspaceRoles,
} from "@/constant";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCreateTaskMutation } from "@/features/task";
import {
  useProjectMembersQuery,
  useProjectTeamsQuery,
  useProjectsQuery,
} from "@/features/project";
import { useWorkspaceQuery } from "@/features/workspace";
import { useGetMyAssociations } from "@/features/association";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export default function CreateTaskForm(props: {
  projectId?: string;
  defaultStatus?: TaskStatusEnumType;
  onClose: () => void;
}) {
  const { projectId, defaultStatus, onClose } = props;

  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  // Current authenticated user
  const { data: authData } = useAuth();
  const currentUser = authData?.user;

  const { mutate, isPending } = useCreateTaskMutation();

  // Projects list in workspace
  const { data: projectsData, isLoading: isLoadingProjects } = useProjectsQuery({
    workspaceId,
    skip: !!projectId,
  });
  const projects = projectsData?.projects || [];

  const formSchema = z.object({
    title: z.string().trim().min(1, {
      message: "Title is required",
    }),
    description: z.string().trim(),
    projectId: z.string().trim().min(1, {
      message: "Project is required",
    }),
    status: z.enum(
      Object.values(TaskStatusEnum) as [keyof typeof TaskStatusEnum],
      {
        required_error: "Status is required",
      }
    ),
    priority: z.enum(
      Object.values(TaskPriorityEnum) as [keyof typeof TaskPriorityEnum],
      {
        required_error: "Priority is required",
      }
    ),
    assignedTo: z
      .array(z.string().trim())
      .min(1, { message: "At least one assignee is required" }),
    reportedTo: z.string().trim().optional(),
    teamId: z.string().trim().optional(),
    dueDate: z.date({
      required_error: "A due date is required.",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: projectId ? projectId : "",
      status: (defaultStatus || TaskStatusEnum.TODO) as keyof typeof TaskStatusEnum,
      teamId: "none",
      assignedTo: currentUser?._id ? [currentUser._id] : [],
      reportedTo: "none",
    },
  });

  useEffect(() => {
    if (defaultStatus) {
      form.setValue("status", defaultStatus as keyof typeof TaskStatusEnum);
    }
  }, [defaultStatus, form]);

  const selectedProjectId = projectId || form.watch("projectId");

  // Fetch corresponding Teams of the selected project
  const { data: projectTeamsData, isLoading: isLoadingTeams } = useProjectTeamsQuery(
    { workspaceId, projectId: selectedProjectId },
    { enabled: Boolean(workspaceId && selectedProjectId) }
  );
  const teams = projectTeamsData?.teams || [];

  // Fetch corresponding Members of the selected project
  const { data: projectMembersData, isLoading: isLoadingMembers } = useProjectMembersQuery(
    { workspaceId, projectId: selectedProjectId },
    { enabled: Boolean(workspaceId && selectedProjectId) }
  );
  const projectMembers = projectMembersData?.members || [];

  // Determine user permissions / lead-head status
  const { data: workspaceData } = useWorkspaceQuery(workspaceId);
  const { data: myAssociationsData } = useGetMyAssociations(workspaceId);

  // 1. Workspace role check (OWNER, ADMIN, MANAGER have management authority)
  const currentUserWorkspaceMember = workspaceData?.workspace?.members?.find(
    (m: any) => {
      const uid = typeof m.userId === "object" ? m.userId?._id : m.userId;
      return String(uid) === String(currentUser?._id);
    }
  );
  const workspaceRole = currentUserWorkspaceMember?.role?.name?.toUpperCase();
  const isWorkspaceAdminOrOwner =
    workspaceRole === WorkspaceRoles.OWNER ||
    workspaceRole === WorkspaceRoles.ADMIN ||
    workspaceRole === WorkspaceRoles.MANAGER;

  // 2. Project creator check
  const currentProject = projects.find((p) => p._id === selectedProjectId);
  const isProjectCreator =
    (currentProject &&
      currentUser &&
      String(currentProject.createdBy) === String(currentUser._id)) ||
    false;

  // 3. Associations check (Project HEAD/LEAD)
  const myAssocs = myAssociationsData?.associations || [];
  const isProjectHeadOrLead = Boolean(
    isProjectCreator ||
      myAssocs.some(
        (a) =>
          a.status === "ACTIVE" &&
          a.scopeType === "PROJECT" &&
          String(a.scopeId) === String(selectedProjectId) &&
          (a.role === AssociationRoles.HEAD || a.role === AssociationRoles.LEAD)
      )
  );

  // 4. Teams led by current user (HEAD, LEAD, or createdBy)
  const userLedTeams = teams.filter((t: any) => {
    if (String(t.createdBy) === String(currentUser?._id)) return true;
    return myAssocs.some(
      (a) =>
        a.status === "ACTIVE" &&
        a.scopeType === "TEAM" &&
        String(a.scopeId) === String(t._id) &&
        (a.role === AssociationRoles.HEAD || a.role === AssociationRoles.LEAD)
    );
  });

  const isTeamLead = userLedTeams.length > 0;
  const isTeamLeadOnly = isTeamLead && !isProjectHeadOrLead && !isWorkspaceAdminOrOwner;
  const isLeadOrHead = isWorkspaceAdminOrOwner || isProjectHeadOrLead || isTeamLead;

  // Enforce assignment rules on role or project change
  useEffect(() => {
    if (!selectedProjectId) return;

    if (!isLeadOrHead && currentUser?._id) {
      // Normal user: locked to themselves and cannot select a team
      form.setValue("assignedTo", [currentUser._id]);
      form.setValue("teamId", "none");
    } else if (isTeamLeadOnly) {
      // Team lead: auto-select team if not yet set
      const currentTeam = form.getValues("teamId");
      if ((!currentTeam || currentTeam === "none") && userLedTeams.length > 0) {
        form.setValue("teamId", userLedTeams[0]._id);
      }
    }
  }, [isLeadOrHead, isTeamLeadOnly, currentUser?._id, selectedProjectId, userLedTeams, form]);

  // Handle project change from dropdown
  const handleProjectSelect = (projId: string) => {
    form.setValue("projectId", projId);
    form.setValue("teamId", "none");
    if (!isLeadOrHead && currentUser?._id) {
      form.setValue("assignedTo", [currentUser._id]);
    }
  };

  // Workspace Projects Dropdown Options
  const projectOptions = projects?.map((project) => ({
    label: (
      <div className="flex items-center gap-2">
        <span>{project.emoji}</span>
        <span className="font-medium">{project.name}</span>
      </div>
    ),
    value: project._id,
  }));

  // Build list of available members from the project
  const allAvailableMembers: any[] = [...projectMembers];
  if (
    currentUser &&
    !allAvailableMembers.some(
      (m) => String(m.user?._id) === String(currentUser._id)
    )
  ) {
    allAvailableMembers.unshift({
      associationId: "current-user",
      memberId: "current-user",
      user: {
        _id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        profilePicture: currentUser.profilePicture || undefined,
      },
      workspaceRole: workspaceRole || "Member",
      projectRole: (isProjectCreator || isWorkspaceAdminOrOwner
        ? AssociationRoles.HEAD
        : AssociationRoles.MEMBER) as any,
      teams: [],
    });
  }

  // Filter assignable members based on authority:
  // Requirement 4:
  // - Regular member: only self
  // - Team lead: only members of their led team
  // - Project head / lead / workspace admin: all project members
  const selectedTeamId = form.watch("teamId");
  let displayedMembers = allAvailableMembers;

  if (!isLeadOrHead) {
    displayedMembers = allAvailableMembers.filter(
      (m) => String(m.user?._id) === String(currentUser?._id)
    );
  } else if (isTeamLeadOnly) {
    if (selectedTeamId && selectedTeamId !== "none") {
      displayedMembers = allAvailableMembers.filter((m) =>
        m.teams?.some((t: any) => String(t._id) === String(selectedTeamId)) ||
        String(m.user?._id) === String(currentUser?._id)
      );
    } else {
      displayedMembers = allAvailableMembers.filter((m) =>
        userLedTeams.some((lt) =>
          m.teams?.some((t: any) => String(t._id) === String(lt._id))
        ) || String(m.user?._id) === String(currentUser?._id)
      );
    }
  }

  // Eligible supervisors for Reported-To:
  // Project creator, Project HEAD/LEAD, Workspace Admin/Owner/Manager, Team HEAD/LEAD
  const eligibleReporters = allAvailableMembers.filter((m) => {
    const isWkManager =
      m.workspaceRole?.toUpperCase() === WorkspaceRoles.OWNER ||
      m.workspaceRole?.toUpperCase() === WorkspaceRoles.ADMIN ||
      m.workspaceRole?.toUpperCase() === WorkspaceRoles.MANAGER;
    const isProjHead =
      m.projectRole === AssociationRoles.HEAD ||
      m.projectRole === AssociationRoles.LEAD ||
      (currentProject && String(currentProject.createdBy) === String(m.user?._id));
    const isTmHead = m.teams?.some(
      (t: any) => t.role === AssociationRoles.HEAD || t.role === AssociationRoles.LEAD
    );
    return isWkManager || isProjHead || isTmHead;
  });

  const taskStatusList = Object.values(TaskStatusEnum);
  const taskPriorityList = Object.values(TaskPriorityEnum);

  const statusOptions = transformOptions(taskStatusList);
  const priorityOptions = transformOptions(taskPriorityList);

  const selectedAssignees = form.watch("assignedTo") || [];

  const toggleAssignee = (userIdStr: string) => {
    if (!isLeadOrHead) return;
    const current = form.getValues("assignedTo") || [];
    if (current.includes(userIdStr)) {
      if (current.length > 1) {
        form.setValue(
          "assignedTo",
          current.filter((id) => id !== userIdStr),
          { shouldValidate: true }
        );
      }
    } else {
      form.setValue("assignedTo", [...current, userIdStr], {
        shouldValidate: true,
      });
    }
  };

  const removeAssignee = (userIdStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLeadOrHead) return;
    const current = form.getValues("assignedTo") || [];
    if (current.length > 1) {
      form.setValue(
        "assignedTo",
        current.filter((id) => id !== userIdStr),
        { shouldValidate: true }
      );
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;

    // Normal user safety: enforce self-assignment and no team
    const finalAssignedTo = !isLeadOrHead
      ? [currentUser?._id || values.assignedTo[0]]
      : values.assignedTo;
    const finalTeamId =
      !isLeadOrHead || values.teamId === "none" ? null : values.teamId;
    const finalReportedTo =
      values.reportedTo === "none" || !values.reportedTo ? null : values.reportedTo;

    const payload = {
      workspaceId,
      projectId: values.projectId,
      data: {
        ...values,
        assignedTo: finalAssignedTo,
        reportedTo: finalReportedTo,
        teamId: finalTeamId,
        dueDate: values.dueDate.toISOString(),
      },
    };

    mutate(payload, {
      onSuccess: () => {
        const targetProjectId = projectId || values.projectId;
        if (targetProjectId) {
          queryClient.invalidateQueries({
            queryKey: ["project-analytics", targetProjectId],
          });
          queryClient.invalidateQueries({
            queryKey: ["project-overview", targetProjectId],
          });
          queryClient.invalidateQueries({
            queryKey: ["project-members", workspaceId, targetProjectId],
          });
          queryClient.invalidateQueries({
            queryKey: ["project-teams", workspaceId, targetProjectId],
          });
        }

        queryClient.invalidateQueries({
          queryKey: ["all-tasks", workspaceId],
        });

        queryClient.invalidateQueries({
          queryKey: ["workspace-analytics", workspaceId],
        });

        toast({
          title: "Success",
          description: "Task created successfully",
          variant: "success",
        });
        onClose();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const [assigneeSearch, setAssigneeSearch] = useState("");
  const filteredDisplayedMembers = displayedMembers.filter((m) => {
    if (!assigneeSearch.trim()) return true;
    const term = assigneeSearch.toLowerCase();
    const name = (m.user?.name || "").toLowerCase();
    const email = (m.user?.email || "").toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1
            className="text-xl tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1
           text-center sm:text-left"
          >
            Create Task
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Organize work, assign multiple members, designate teams, and set reportees.
          </p>
        </div>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Title */}
            <div>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Task title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Website Redesign, API Performance Tuning"
                        className="!h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Task description
                      <span className="text-xs font-extralight ml-2">
                        Optional
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Add context, acceptance criteria, or deliverables..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Project Selection */}
            {!projectId && (
              <div>
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select
                        onValueChange={handleProjectSelect}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingProjects && (
                            <div className="my-2 flex justify-center">
                              <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                          <div className="w-full max-h-[200px] overflow-y-auto scrollbar">
                            {projectOptions?.map((option) => (
                              <SelectItem
                                key={option.value}
                                className="!capitalize cursor-pointer"
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Team Selection */}
            <div>
              <FormField
                control={form.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Team
                      </span>
                      <span className="text-xs font-extralight">
                        {isLeadOrHead ? "Optional" : "Leads/Heads Only"}
                      </span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "none"}
                      disabled={
                        !selectedProjectId || !isLeadOrHead || isLoadingTeams
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !selectedProjectId
                                ? "Select a project first"
                                : !isLeadOrHead
                                ? "Only leads/heads can assign to teams"
                                : isLoadingTeams
                                ? "Loading teams..."
                                : "Select a team (optional)"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingTeams && (
                          <div className="my-2 flex justify-center">
                            <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        <div className="w-full max-h-[200px] overflow-y-auto scrollbar">
                          {!isTeamLeadOnly && <SelectItem value="none">No Team (Project Task)</SelectItem>}
                          {(isTeamLeadOnly ? userLedTeams : teams).map((t) => (
                            <SelectItem key={t._id} value={t._id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                    {!selectedProjectId ? (
                      <p className="text-[12px] text-muted-foreground mt-1">
                        Select a project to view its corresponding teams.
                      </p>
                    ) : !isLeadOrHead ? (
                      <p className="text-[12px] text-amber-500/90 dark:text-amber-400/90 flex items-center gap-1 mt-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Only project or team leads and heads can assign tasks to teams.
                      </p>
                    ) : isTeamLeadOnly && userLedTeams.length > 0 ? (
                      <p className="text-[12px] text-muted-foreground mt-1">
                        As team lead, tasks are assigned to your squad.
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Multi-Assignee Selection */}
            <div>
              <FormField
                control={form.control}
                name="assignedTo"
                render={() => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        Assign To (Multiple Members)
                      </span>
                      {!isLeadOrHead && selectedProjectId && (
                        <span className="text-xs text-muted-foreground">
                          Self-assignment only
                        </span>
                      )}
                    </FormLabel>

                    {!isLeadOrHead ? (
                      // Regular member: read-only self assignment
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/30">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={currentUser?.profilePicture || ""} alt={currentUser?.name || ""} />
                          <AvatarFallback className={getAvatarColor(currentUser?.name || "")}>
                            {getAvatarFallbackText(currentUser?.name || "")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">
                          {currentUser?.name} (You - Member)
                        </span>
                        <Badge variant="secondary" className="text-[10px] ml-auto">
                          Self-assigned
                        </Badge>
                      </div>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              disabled={!selectedProjectId || isLoadingMembers}
                              className="w-full justify-between min-h-[44px] h-auto p-2"
                            >
                              <div className="flex flex-wrap items-center gap-1.5 max-w-[90%]">
                                {selectedAssignees.length === 0 ? (
                                  <span className="text-muted-foreground text-xs font-normal">
                                    Select assignees...
                                  </span>
                                ) : (
                                  selectedAssignees.map((id) => {
                                    const mem = allAvailableMembers.find(
                                      (m) => String(m.user?._id) === String(id)
                                    );
                                    const name = mem?.user?.name || "Member";
                                    return (
                                      <Badge
                                        key={id}
                                        variant="secondary"
                                        className="gap-1 pl-1 pr-1.5 py-0.5 text-xs font-normal"
                                      >
                                        <Avatar className="h-4 w-4">
                                          <AvatarImage src={mem?.user?.profilePicture || ""} />
                                          <AvatarFallback className="text-[8px]">
                                            {getAvatarFallbackText(name)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span>{name}</span>
                                        {selectedAssignees.length > 1 && (
                                          <X
                                            className="h-3 w-3 hover:text-destructive cursor-pointer ml-0.5"
                                            onClick={(e) => removeAssignee(id, e)}
                                          />
                                        )}
                                      </Badge>
                                    );
                                  })
                                )}
                              </div>
                              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[340px] p-2" align="start">
                          <div className="space-y-2">
                            <Input
                              placeholder="Search member by name/email..."
                              value={assigneeSearch}
                              onChange={(e) => setAssigneeSearch(e.target.value)}
                              className="h-8 text-xs"
                            />
                            <div className="max-h-[220px] overflow-y-auto space-y-1">
                              {isLoadingMembers && (
                                <div className="p-4 text-center">
                                  <Loader className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                                </div>
                              )}
                              {!isLoadingMembers && filteredDisplayedMembers.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-3">
                                  No assignable members found.
                                </p>
                              )}
                              {filteredDisplayedMembers.map((member) => {
                                const uid = String(member.user?._id);
                                const isSelected = selectedAssignees.includes(uid);
                                const name = member.user?.name || "Unknown";
                                const isSelf = currentUser && String(currentUser._id) === uid;
                                const teamNames = member.teams?.map((t: any) => t.name).join(", ");

                                return (
                                  <div
                                    key={uid}
                                    onClick={() => toggleAssignee(uid)}
                                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/70 cursor-pointer text-xs transition-colors"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleAssignee(uid)}
                                      />
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={member.user?.profilePicture || ""} alt={name} />
                                        <AvatarFallback className={getAvatarColor(name)}>
                                          {getAvatarFallbackText(name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="truncate">
                                        <p className="font-medium truncate">
                                          {name} {isSelf && "(You)"}
                                        </p>
                                        {teamNames && (
                                          <p className="text-[10px] text-muted-foreground truncate">
                                            {teamNames}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    {member.projectRole && member.projectRole !== "MEMBER" && (
                                      <Badge variant="outline" className="text-[9px] py-0 px-1 shrink-0 uppercase font-semibold">
                                        {member.projectRole}
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    {isTeamLeadOnly && (
                      <p className="text-[12px] text-muted-foreground mt-1">
                        As team lead, you can only assign tasks to members of your team.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reported To Selection */}
            <div>
              <FormField
                control={form.control}
                name="reportedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        Reported To (Supervisor / Lead)
                      </span>
                      <span className="text-xs font-extralight">Optional</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "none"}
                      disabled={!selectedProjectId || isLoadingMembers}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select who to report to..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div className="w-full max-h-[200px] overflow-y-auto scrollbar">
                          <SelectItem value="none">None / Direct</SelectItem>
                          {eligibleReporters.map((reporter) => {
                            const rName = reporter.user?.name || "Unknown";
                            const isSelf = currentUser && String(currentUser._id) === String(reporter.user?._id);
                            return (
                              <SelectItem key={reporter.user?._id} value={reporter.user?._id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={reporter.user?.profilePicture || ""} alt={rName} />
                                    <AvatarFallback className={getAvatarColor(rName)}>
                                      {getAvatarFallbackText(rName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>
                                    {rName} {isSelf && "(You)"}
                                  </span>
                                  {reporter.projectRole && reporter.projectRole !== "MEMBER" && (
                                    <Badge variant="outline" className="text-[9px] py-0 px-1 ml-1 uppercase">
                                      {reporter.projectRole}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </div>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Due Date */}
            <div className="!mt-2">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full flex-1 pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date <
                              new Date(new Date().setHours(0, 0, 0, 0)) ||
                            date > new Date("2100-12-31")
                          }
                          initialFocus
                          defaultMonth={new Date()}
                          fromMonth={new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Status */}
              <div>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              className="!text-muted-foreground !capitalize"
                              placeholder="Select status"
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions?.map((status) => (
                            <SelectItem
                              className="!capitalize"
                              key={status.value}
                              value={status.value}
                            >
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Priority */}
              <div>
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorityOptions?.map((priority) => (
                            <SelectItem
                              className="!capitalize"
                              key={priority.value}
                              value={priority.value}
                            >
                              {priority.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              className="flex place-self-end h-[40px] text-white font-semibold mt-4"
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader className="animate-spin mr-2" />}
              Create Task
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
