import { Link } from "react-router-dom";
import { Loader, Shield, Backpack, Crown, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useMyAssociationsQuery as useGetMyAssociations } from "@/features/association";
import { AssociationRoles, AssociationRoleType } from "@/constant";

const ROLE_BADGE: Record<
  AssociationRoleType,
  { label: string; className: string; icon: typeof Crown }
> = {
  [AssociationRoles.HEAD]: {
    label: "Head",
    className:
      "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20",
    icon: Crown,
  },
  [AssociationRoles.LEAD]: {
    label: "Lead",
    className:
      "border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20",
    icon: Shield,
  },
  [AssociationRoles.MEMBER]: {
    label: "Member",
    className:
      "border-slate-300 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20",
    icon: Users,
  },
};

export const MyAssociationsList = () => {
  const workspaceId = useWorkspaceId();
  const { data, isLoading } = useGetMyAssociations(workspaceId);

  const associations = data?.associations || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (associations.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        You are not currently assigned to any teams or projects in this workspace.
      </div>
    );
  }

  return (
    <ul role="list" className="space-y-2 pt-2">
      {associations.map((assoc) => {
        const isProject = assoc.scopeType === "PROJECT";
        const details = assoc.scopeDetails;
        const name = details?.name || (isProject ? "Untitled Project" : "Untitled Team");
        const emoji = details?.emoji || (isProject ? "📊" : null);
        const url = isProject
          ? `/workspace/${workspaceId}/project/${assoc.scopeId}`
          : `/workspace/${workspaceId}/team/${assoc.scopeId}`;

        const roleConfig = ROLE_BADGE[assoc.role] || ROLE_BADGE.MEMBER;
        const RoleIcon = roleConfig.icon;

        return (
          <li
            key={assoc._id}
            role="listitem"
            className="rounded-lg border p-3 hover:bg-muted/40 transition-colors"
          >
            <Link to={url} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {isProject ? (
                    emoji ? (
                      <span className="text-lg">{emoji}</span>
                    ) : (
                      <Backpack className="w-4 h-4" />
                    )
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate text-foreground hover:underline">
                      {name}
                    </p>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                      {assoc.scopeType}
                    </Badge>
                  </div>
                  {details?.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-md">
                      {details.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={`gap-1 font-medium text-xs ${roleConfig.className}`}
                >
                  <RoleIcon className="w-3 h-3" />
                  <span>{roleConfig.label}</span>
                </Badge>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default MyAssociationsList;

