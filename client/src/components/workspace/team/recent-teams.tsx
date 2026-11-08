import { Link } from "react-router-dom";
import { Loader, Shield, Users } from "lucide-react";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useTeamsQuery } from "@/features/team";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";

export const RecentTeams = () => {
  const workspaceId = useWorkspaceId();

  const { data, isLoading } = useTeamsQuery({
    workspaceId,
    pageNumber: 1,
    pageSize: 5,
  });

  const teams = data?.teams || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="font-semibold text-sm text-muted-foreground text-center py-5">
        No teams created yet
      </div>
    );
  }

  return (
    <ul role="list" className="space-y-2 pt-2">
      {teams.map((team) => {
        const creatorName = team.createdBy?.name || "Unknown";
        const initials = getAvatarFallbackText(creatorName);
        const avatarColor = getAvatarColor(creatorName);

        return (
          <li
            key={team._id}
            role="listitem"
            className="rounded-lg border p-3 hover:bg-gray-50 transition-colors"
          >
            <Link
              to={`/workspace/${workspaceId}/team/${team._id}`}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate text-foreground hover:underline">
                      {team.name}
                    </p>
                    {team.slug && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        @{team.slug}
                      </span>
                    )}
                  </div>
                  {team.description ? (
                    <p className="text-xs text-muted-foreground truncate max-w-sm">
                      {team.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="outline" className="text-xs gap-1 font-normal text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{team.membersCount || 0} members</span>
                </Badge>

                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Created by</span>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={team.createdBy?.profilePicture || ""} alt={creatorName} />
                    <AvatarFallback className={`text-[10px] ${avatarColor}`}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default RecentTeams;
