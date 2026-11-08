import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Crown, Shield, Users } from "lucide-react";

import { DataTableColumnHeader } from "../../task/table/table-column-header";
import { ProjectTableRowActions } from "./project-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ProjectType } from "@/features/project";
import { AssociationType } from "@/features/association";
import { AssociationRoles } from "@/constant";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const getProjectColumns = (
  workspaceId: string,
  associations: AssociationType[] = []
): ColumnDef<ProjectType>[] => {
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
        <DataTableColumnHeader column={column} title="Project" />
      ),
      cell: ({ row }) => {
        const project = row.original;
        const assoc = associations.find(
          (a) =>
            a.scopeType === "PROJECT" &&
            a.scopeId === project._id &&
            a.status === "ACTIVE"
        );

        return (
          <div className="flex items-center space-x-3">
            <span className="text-xl p-1.5 rounded-lg bg-muted flex items-center justify-center shrink-0">
              {project.emoji || "📊"}
            </span>
            <div className="flex flex-col gap-1">
              <Link
                to={`/workspace/${workspaceId}/project/${project._id}`}
                className="font-semibold text-foreground hover:underline hover:text-primary transition-colors truncate max-w-[240px]"
              >
                {project.name}
              </Link>
              {assoc && (
                <div className="flex items-center gap-1">
                  {assoc.role === AssociationRoles.HEAD && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 gap-0.5 w-fit font-medium"
                    >
                      <Crown className="w-2.5 h-2.5" />
                      <span>Head</span>
                    </Badge>
                  )}
                  {assoc.role === AssociationRoles.LEAD && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 gap-0.5 w-fit font-medium"
                    >
                      <Shield className="w-2.5 h-2.5" />
                      <span>Lead</span>
                    </Badge>
                  )}
                  {assoc.role === AssociationRoles.MEMBER && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 border-slate-300 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 gap-0.5 w-fit font-medium"
                    >
                      <Users className="w-2.5 h-2.5" />
                      <span>Member</span>
                    </Badge>
                  )}
                </div>
              )}
            </div>
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
          return (
            <span className="text-muted-foreground/60 italic text-sm">
              No description
            </span>
          );
        }
        return (
          <span
            className="block max-w-[320px] truncate text-muted-foreground text-sm"
            title={description}
          >
            {description}
          </span>
        );
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
              <AvatarFallback className={`text-[10px] ${avatarColor}`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm truncate max-w-[140px]">{name}</span>
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
      cell: ({ row }) => <ProjectTableRowActions row={row} />,
      enableSorting: false,
      enableHiding: false,
    },
  ];
};

export default getProjectColumns;
