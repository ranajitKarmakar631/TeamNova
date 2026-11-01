import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Users, Shield, CheckCircle2, Archive, MinusCircle, Crown } from "lucide-react";

import { DataTableColumnHeader } from "./table-column-header";
import { TeamTableRowActions } from "./team-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TeamType, AssociationType, AssociationRoles } from "@/types/api.type";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getStatusBadge = (status: TeamType["status"]) => {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 gap-1 font-medium"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Active
        </Badge>
      );
    case "ARCHIVED":
      return (
        <Badge
          variant="secondary"
          className="gap-1 font-medium text-muted-foreground"
        >
          <Archive className="w-3 h-3" />
          Archived
        </Badge>
      );
    case "INACTIVE":
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 gap-1 font-medium"
        >
          <MinusCircle className="w-3 h-3 text-amber-500" />
          Inactive
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const getTeamColumns = (
  workspaceId: string,
  associations: AssociationType[] = []
): ColumnDef<TeamType>[] => {
  return [
    {
      id: "select",
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
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Team Name" />
      ),
      cell: ({ row }) => {
        const team = row.original;
        const assoc = associations.find(
          (a) =>
            a.scopeType === "TEAM" &&
            a.scopeId === team._id &&
            a.status === "ACTIVE"
        );

        return (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4" />
              </div>
              <Link
                to={`/workspace/${workspaceId}/team/${team._id}`}
                className="font-semibold text-foreground hover:underline hover:text-primary transition-colors truncate max-w-[220px]"
              >
                {team.name}
              </Link>
              {assoc && (
                <div className="flex items-center gap-1">
                  {assoc.role === AssociationRoles.HEAD && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 gap-0.5 font-medium"
                    >
                      <Crown className="w-2.5 h-2.5" />
                      <span>Head</span>
                    </Badge>
                  )}
                  {assoc.role === AssociationRoles.LEAD && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 gap-0.5 font-medium"
                    >
                      <Shield className="w-2.5 h-2.5" />
                      <span>Lead</span>
                    </Badge>
                  )}
                  {assoc.role === AssociationRoles.MEMBER && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 border-slate-300 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 gap-0.5 font-medium"
                    >
                      <Users className="w-2.5 h-2.5" />
                      <span>Member</span>
                    </Badge>
                  )}
                </div>
              )}
            </div>
            {team.slug && (
              <span className="text-[11px] text-muted-foreground font-mono pl-9">
                @{team.slug}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        const description = row.original.description;
        if (!description) {
          return <span className="text-muted-foreground/60 italic text-sm">No description</span>;
        }
        return (
          <span className="block max-w-[280px] truncate text-muted-foreground text-sm" title={description}>
            {description}
          </span>
        );
      },
    },
    {
      accessorKey: "membersCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Members" />
      ),
      cell: ({ row }) => {
        const count = row.original.membersCount ?? 0;
        return (
          <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{count} {count === 1 ? "member" : "members"}</span>
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        return getStatusBadge(row.original.status);
      },
    },
    {
      accessorKey: "createdBy",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created By" />
      ),
      cell: ({ row }) => {
        const creator = row.original.createdBy;
        const name = creator?.name || "Unknown";
        const initials = getAvatarFallbackText(name);
        const avatarColor = getAvatarColor(name);

        return (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={creator?.profilePicture || ""} alt={name} />
              <AvatarFallback className={`text-[10px] ${avatarColor}`}>{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm truncate max-w-[120px]">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created Date" />
      ),
      cell: ({ row }) => {
        const date = row.original.createdAt;
        if (!date) return <span className="text-muted-foreground">-</span>;
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(date), "MMM d, yyyy")}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <TeamTableRowActions row={row} />,
      enableSorting: false,
      enableHiding: false,
    },
  ];
};
