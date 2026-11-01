import CreateTeamDialog from "@/components/workspace/team/create-team-dialog";
import TeamsTable from "@/components/workspace/task/table/teams-table";
import { useAuthContext } from "@/context/auth-provider";
import { Permissions } from "@/constant";

export default function Teams() {
  const { hasPermission } = useAuthContext();
  const canCreateTeam = hasPermission(Permissions.TEAM_CREATE);

  return (
    <div className="w-full h-full flex-col space-y-8 pt-3">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
          <p className="text-muted-foreground">
            Manage your workspace teams, squad structures, and cross-project collaboration!
          </p>
        </div>
        {canCreateTeam && <CreateTeamDialog />}
      </div>
      <div>
        <TeamsTable />
      </div>
    </div>
  );
}