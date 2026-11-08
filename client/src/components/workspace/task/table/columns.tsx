import { Column, ColumnDef, Row } from "@tanstack/react-table";
import { format } from "date-fns";

import { DataTableColumnHeader } from "./table-column-header";
import { DataTableRowActions } from "./table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "@/constant";
import {
  formatStatusToEnum,
  getAvatarColor,
  getAvatarFallbackText,
} from "@/lib/helper";
import { priorities, statuses } from "./data";
import { TaskType } from "@/types/api.type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";

export const getColumns = (projectId?: string): ColumnDef<TaskType>[] => {
  const columns: ColumnDef<TaskType>[] = [
    {
      id: "_id",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => {
        const commentCount = row.original.commentCount ?? 0;
        return (
          <div className="flex flex-wrap items-center space-x-2">
            <Badge variant="outline" className="capitalize shrink-0 h-[25px]">
              {row.original.taskCode}
            </Badge>
            <span className="block lg:max-w-[220px] max-w-[200px] font-medium truncate">
              {row.original.title}
            </span>
            {commentCount > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 hover:text-foreground font-medium"
                title={`${commentCount} comments`}
              >
                <MessageSquare className="w-3 h-3" />
                {commentCount}
              </span>
            )}
          </div>
        );
      },
    },
    ...(projectId
      ? [] // If projectId exists, exclude the "Project" column
      : [
          {
            accessorKey: "project",
            header: ({ column }: { column: Column<TaskType, unknown> }) => (
              <DataTableColumnHeader column={column} title="Project" />
            ),
            cell: ({ row }: { row: Row<TaskType> }) => {
              const project = row.original.project;

              if (!project) {
                return null;
              }

              return (
                <div className="flex items-center gap-1">
                  <span className="rounded-full border">{project.emoji}</span>
                  <span className="block capitalize truncate w-[100px] text-ellipsis">
                    {project.name}
                  </span>
                </div>
              );
            },
          },
        ]),
    {
      accessorKey: "assignedTo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assigned To" />
      ),
      cell: ({ row }) => {
        const rawAssigned = row.original.assignedTo;
        const assignees = Array.isArray(rawAssigned)
          ? rawAssigned
          : rawAssigned
          ? [rawAssigned]
          : [];

        if (assignees.length === 0) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }

        if (assignees.length === 1) {
          const assignee = assignees[0];
          const name = assignee?.name || "";
          const initials = getAvatarFallbackText(name);
          const avatarColor = getAvatarColor(name);

          return (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-6 w-6">
                <AvatarImage src={assignee?.profilePicture || ""} alt={name} />
                <AvatarFallback className={avatarColor}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="block text-ellipsis w-[100px] truncate text-xs">
                {name}
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {assignees.slice(0, 3).map((a, idx) => {
              const name = a?.name || "";
              const initials = getAvatarFallbackText(name);
              const avatarColor = getAvatarColor(name);
              return (
                <Avatar key={a?._id || idx} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={a?.profilePicture || ""} alt={name} />
                  <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
                </Avatar>
              );
            })}
            {assignees.length > 3 && (
              <span className="text-[10px] pl-2 text-muted-foreground font-medium">
                +{assignees.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "reportedTo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reported To" />
      ),
      cell: ({ row }) => {
        const reporter = row.original.reportedTo;
        if (!reporter) return <span className="text-muted-foreground text-xs">—</span>;
        const name = reporter.name || "";
        const initials = getAvatarFallbackText(name);
        const avatarColor = getAvatarColor(name);

        return (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-6 w-6">
              <AvatarImage src={reporter.profilePicture || ""} alt={name} />
              <AvatarFallback className={avatarColor}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="block text-ellipsis w-[100px] truncate text-xs">
              {name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "team",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Team" />
      ),
      cell: ({ row }) => {
        const team = row.original.team;
        if (!team) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <Badge variant="outline" className="text-xs font-normal">
            {team.name}
          </Badge>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => {
        return (
          <span className="lg:max-w-[100px] text-sm">
            {row.original.dueDate ? format(row.original.dueDate, "PPP") : null}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = statuses.find(
          (status) => status.value === row.getValue("status")
        );

        if (!status) {
          return null;
        }

        const statusKey = formatStatusToEnum(
          status.value
        ) as TaskStatusEnumType;
        const Icon = status.icon;

        if (!Icon) {
          return null;
        }

        return (
          <div className="flex lg:w-[120px] items-center">
            <Badge
              variant={TaskStatusEnum[statusKey]}
              className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0"
            >
              <Icon className="h-4 w-4 rounded-full text-inherit" />
              <span>{status.label}</span>
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      cell: ({ row }) => {
        const priority = priorities.find(
          (priority) => priority.value === row.getValue("priority")
        );

        if (!priority) {
          return null;
        }

        const statusKey = formatStatusToEnum(
          priority.value
        ) as TaskPriorityEnumType;
        const Icon = priority.icon;

        if (!Icon) {
          return null;
        }

        return (
          <div className="flex items-center">
            <Badge
              variant={TaskPriorityEnum[statusKey]}
              className="flex lg:w-[110px] p-1 gap-1 !bg-transparent font-medium !shadow-none uppercase border-0"
            >
              <Icon className="h-4 w-4 rounded-full text-inherit" />
              <span>{priority.label}</span>
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <>
            <DataTableRowActions row={row} />
          </>
        );
      },
    },
  ];

  return columns;
};
