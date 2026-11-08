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
  UserCheck,
  Users,
  X,
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
  WorkspaceRoles,
} from "@/constant";
import { useAuth } from "@/features/auth";
import { useGetMyAssociations } from "@/features/association";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateTaskMutation, TaskType } from "@/features/task";
import {
  useProjectMembersQuery,
  useProjectTeamsQuery,
} from "@/features/project";
import { useWorkspaceQuery } from "@/features/workspace";
import { toast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskComments } from "./comments";

export default function EditTaskForm({
  task,
  onClose,
}: {
  task: TaskType;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { data: authData } = useAuth();
  const currentUser = authData?.user;

  const projectId = task.project?._id ?? "";
  const [assigneeSearch, setAssigneeSearch] = useState("");

  const { mutate, isPending } = useUpdateTaskMutation();

  // Fetch corresponding Teams of this task's project
  const { data: projectTeamsData, isLoading: isLoadingTeams } = useProjectTeamsQuery(
    { workspaceId, projectId },
    { enabled: Boolean(workspaceId && projectId) }
  );
  const teams = projectTeamsData?.teams || [];

  // Fetch corresponding Members of this task's project
  const { data: projectMembersData, isLoading: isLoadingMembers } = useProjectMembersQuery(
    { workspaceId, projectId },
    { enabled: Boolean(workspaceId && projectId) }
  );
  const projectMembers = projectMembersData?.members || [];

  // Role & permission checks
  const { data: workspaceData } = useWorkspaceQuery(workspaceId);
  const { data: myAssociationsData } = useGetMyAssociations(workspaceId);

  // 1. Workspace role
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

  // 2. User associations in project or teams
  const myAssocs = myAssociationsData?.associations || [];
  const isProjectHeadOrLead = myAssocs.some(
    (a) =>
      a.status === "ACTIVE" &&
      a.scopeType === "PROJECT" &&
      String(a.scopeId) === String(projectId) &&
      (a.role === AssociationRoles.HEAD || a.role === AssociationRoles.LEAD)
  );

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
  const isTeamLeadOnly =
    isTeamLead && !isProjectHeadOrLead && !isWorkspaceAdminOrOwner;
  const isLeadOrHead =
    isWorkspaceAdminOrOwner || isProjectHeadOrLead || isTeamLead;

  // Initial assignees
  const initialAssignedTo: string[] = Array.isArray(task.assignedTo)
    ? task.assignedTo.map((a: any) => a._id)
    : (task.assignedTo as any)?._id
    ? [(task.assignedTo as any)._id]
    : currentUser?._id
    ? [currentUser._id]
    : [];

  const initialReportedTo = (task as any).reportedTo?._id || "none";

  const formSchema = z.object({
    title: z.string().trim().min(1, { message: "Title is required" }),
    description: z.string().trim(),
    status: z.enum(
      Object.values(TaskStatusEnum) as [keyof typeof TaskStatusEnum]
    ),
    priority: z.enum(
      Object.values(TaskPriorityEnum) as [keyof typeof TaskPriorityEnum]
    ),
    assignedTo: z
      .array(z.string().trim())
      .min(1, { message: "At least one assignee is required" }),
    reportedTo: z.string().trim().optional(),
    teamId: z.string().trim().optional(),
    dueDate: z.date({ required_error: "A due date is required." }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "TODO",
      priority: task?.priority ?? "MEDIUM",
      assignedTo: initialAssignedTo,
      reportedTo: initialReportedTo,
      teamId: task.team?._id ?? "none",
      dueDate: task?.dueDate ? new Date(task.dueDate) : new Date(),
    },
  });

  // Enforce assignment rules if normal user or team lead
  useEffect(() => {
    if (!isLeadOrHead && currentUser?._id) {
      form.setValue("assignedTo", [currentUser._id]);
      form.setValue("teamId", "none");
    } else if (isTeamLeadOnly) {
      const currentTeam = form.getValues("teamId");
      if ((!currentTeam || currentTeam === "none") && userLedTeams.length > 0) {
        form.setValue("teamId", userLedTeams[0]._id);
      }
    }
  }, [isLeadOrHead, isTeamLeadOnly, currentUser?._id, userLedTeams, form]);

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
        profilePicture: currentUser.profilePicture || undefined,
      },
      workspaceRole: workspaceRole || "Member",
      projectRole: AssociationRoles.MEMBER,
      teams: [],
    });
  }

  // Preserve existing assignees in list even if not in projectMembers query yet
  const existingAssignees = Array.isArray(task.assignedTo)
    ? task.assignedTo
    : task.assignedTo
    ? [task.assignedTo]
    : [];

  existingAssignees.forEach((assignee: any) => {
    if (
      assignee?._id &&
      !allAvailableMembers.some(
        (m) => String(m.user?._id) === String(assignee._id)
      )
    ) {
      allAvailableMembers.unshift({
        associationId: `assignee-${assignee._id}`,
        memberId: `assignee-${assignee._id}`,
        user: {
          _id: assignee._id,
          name: assignee.name,
          profilePicture: assignee.profilePicture || undefined,
        },
        workspaceRole: "Member",
        projectRole: AssociationRoles.MEMBER,
        teams: [],
      });
    }
  });

  const selectedTeamId = form.watch("teamId");
  let displayedMembers = allAvailableMembers;

  if (!isLeadOrHead) {
    displayedMembers = allAvailableMembers.filter(
      (m) => String(m.user?._id) === String(currentUser?._id)
    );
  } else if (isTeamLeadOnly) {
    if (selectedTeamId && selectedTeamId !== "none") {
      displayedMembers = allAvailableMembers.filter(
        (m) =>
          m.teams?.some((t: any) => String(t._id) === String(selectedTeamId)) ||
          String(m.user?._id) === String(currentUser?._id)
      );
    } else {
      displayedMembers = allAvailableMembers.filter(
        (m) =>
          userLedTeams.some((lt) =>
            m.teams?.some((t: any) => String(t._id) === String(lt._id))
          ) || String(m.user?._id) === String(currentUser?._id)
      );
    }
  }

  // Filter assignees by search query
  const filteredDisplayedMembers = displayedMembers.filter((m) => {
    if (!assigneeSearch) return true;
    const q = assigneeSearch.toLowerCase();
    const name = m.user?.name?.toLowerCase() || "";
    const email = m.user?.email?.toLowerCase() || "";
    return name.includes(q) || email.includes(q);
  });

  // Eligible supervisors for Reported-To
  const eligibleReporters = allAvailableMembers.filter((m) => {
    const isWkManager =
      m.workspaceRole?.toUpperCase() === WorkspaceRoles.OWNER ||
      m.workspaceRole?.toUpperCase() === WorkspaceRoles.ADMIN ||
      m.workspaceRole?.toUpperCase() === WorkspaceRoles.MANAGER;
    const isProjHead =
      m.projectRole === AssociationRoles.HEAD ||
      m.projectRole === AssociationRoles.LEAD;
    const isTmHead = m.teams?.some(
      (t: any) =>
        t.role === AssociationRoles.HEAD || t.role === AssociationRoles.LEAD
    );
    return isWkManager || isProjHead || isTmHead;
  });

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

  const taskStatusList = Object.values(TaskStatusEnum);
  const taskPriorityList = Object.values(TaskPriorityEnum);

  const statusOptions = transformOptions(taskStatusList);
  const priorityOptions = transformOptions(taskPriorityList);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;

    const finalAssignedTo = !isLeadOrHead
      ? [currentUser?._id || values.assignedTo[0]]
      : values.assignedTo;
    const finalTeamId =
      !isLeadOrHead || values.teamId === "none" ? null : values.teamId;
    const finalReportedTo =
      values.reportedTo === "none" || !values.reportedTo
        ? null
        : values.reportedTo;

    const payload = {
      workspaceId,
      projectId,
      taskId: task._id,
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
        queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
        queryClient.invalidateQueries({
          queryKey: ["workspace-analytics", workspaceId],
        });
        if (projectId) {
          queryClient.invalidateQueries({
            queryKey: ["project-analytics", projectId],
          });
          queryClient.invalidateQueries({
            queryKey: ["project-overview", projectId],
          });
          queryClient.invalidateQueries({
            queryKey: ["project-members", workspaceId, projectId],
          });
          queryClient.invalidateQueries({
            queryKey: ["project-teams", workspaceId, projectId],
          });
        }
        toast({
          title: "Success",
          description: "Task updated successfully",
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

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1 className="text-xl font-semibold text-center sm:text-left">
            Edit Task
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Update task details, team assignments, and schedules
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
                        placeholder="Website Redesign"
                        className="!h-[48px]"
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
                      <Textarea rows={1} placeholder="Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      disabled={!isLeadOrHead || isLoadingTeams}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !isLeadOrHead
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
                          {!isTeamLeadOnly && (
                            <SelectItem value="none">
                              No Team (Project Task)
                            </SelectItem>
                          )}
                          {(isTeamLeadOnly ? userLedTeams : teams).map((t) => (
                            <SelectItem key={t._id} value={t._id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                    {!isLeadOrHead ? (
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
                      {!isLeadOrHead && (
                        <span className="text-xs text-muted-foreground">
                          Self-assignment only
                        </span>
                      )}
                    </FormLabel>

                    {!isLeadOrHead ? (
                      // Regular member: read-only self assignment
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/30">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={currentUser?.profilePicture || ""}
                            alt={currentUser?.name || ""}
                          />
                          <AvatarFallback
                            className={getAvatarColor(currentUser?.name || "")}
                          >
                            {getAvatarFallbackText(currentUser?.name || "")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">
                          {currentUser?.name} (You - Member)
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] ml-auto"
                        >
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
                              disabled={isLoadingMembers}
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
                                          <AvatarImage
                                            src={mem?.user?.profilePicture || ""}
                                          />
                                          <AvatarFallback className="text-[8px]">
                                            {getAvatarFallbackText(name)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span>{name}</span>
                                        {selectedAssignees.length > 1 && (
                                          <X
                                            className="h-3 w-3 hover:text-destructive cursor-pointer ml-0.5"
                                            onClick={(e) =>
                                              removeAssignee(id, e)
                                            }
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
                              onChange={(e) =>
                                setAssigneeSearch(e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                            <div className="max-h-[220px] overflow-y-auto space-y-1">
                              {isLoadingMembers && (
                                <div className="p-4 text-center">
                                  <Loader className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                                </div>
                              )}
                              {!isLoadingMembers &&
                                filteredDisplayedMembers.length === 0 && (
                                  <p className="text-xs text-muted-foreground text-center py-3">
                                    No assignable members found.
                                  </p>
                                )}
                              {filteredDisplayedMembers.map((member) => {
                                const uid = String(member.user?._id);
                                const isSelected =
                                  selectedAssignees.includes(uid);
                                const name = member.user?.name || "Unknown";
                                const isSelf =
                                  currentUser &&
                                  String(currentUser._id) === uid;
                                const teamNames = member.teams
                                  ?.map((t: any) => t.name)
                                  .join(", ");

                                return (
                                  <div
                                    key={uid}
                                    onClick={() => toggleAssignee(uid)}
                                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/70 cursor-pointer text-xs transition-colors"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() =>
                                          toggleAssignee(uid)
                                        }
                                      />
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage
                                          src={member.user?.profilePicture || ""}
                                          alt={name}
                                        />
                                        <AvatarFallback
                                          className={getAvatarColor(name)}
                                        >
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
                                    {member.projectRole &&
                                      member.projectRole !== "MEMBER" && (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] py-0 px-1 shrink-0 uppercase font-semibold"
                                        >
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
                      disabled={isLoadingMembers}
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
                            const isSelf =
                              currentUser &&
                              String(currentUser._id) ===
                                String(reporter.user?._id);
                            return (
                              <SelectItem
                                key={reporter.user?._id}
                                value={reporter.user?._id}
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage
                                      src={reporter.user?.profilePicture || ""}
                                      alt={rName}
                                    />
                                    <AvatarFallback
                                      className={getAvatarColor(rName)}
                                    >
                                      {getAvatarFallbackText(rName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>
                                    {rName} {isSelf && "(You)"}
                                  </span>
                                  {reporter.projectRole &&
                                    reporter.projectRole !== "MEMBER" && (
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] py-0 px-1 ml-1 uppercase"
                                      >
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
                            placeholder="Select a status"
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
                          <SelectValue placeholder="Select a priority" />
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

            <Button
              className="flex place-self-end h-[40px] text-white font-semibold"
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader className="animate-spin mr-2" />}
              Save Changes
            </Button>
          </form>
        </Form>

        {/* Task Discussion & Scalable Comments */}
        <TaskComments
          taskId={task._id}
          projectId={projectId}
          members={allAvailableMembers.map((m) => ({
            _id: String(m.user?._id || m.userId || m._id),
            name: m.user?.name || m.name || "Member",
            profilePicture: m.user?.profilePicture || m.profilePicture || null,
          }))}
        />
      </div>
    </div>
  );
}
