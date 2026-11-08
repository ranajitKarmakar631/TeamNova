import useWorkspaceId from "@/hooks/use-workspace-id";
import AnalyticsCard from "./common/analytics-card";
import { useWorkspaceAnalyticsQuery } from "@/features/workspace";

const WorkspaceAnalytics = () => {
  const workspaceId = useWorkspaceId();

  const { data, isPending } = useWorkspaceAnalyticsQuery(workspaceId);

  const analytics = data?.analytics;

  return (
    <div className="grid gap-4 md:gap-5 lg:grid-cols-2 xl:grid-cols-3">
      <AnalyticsCard
        isLoading={isPending}
        title="Total Task"
        value={analytics?.totalTasks || 0}
      />
      <AnalyticsCard
        isLoading={isPending}
        title="Overdue Task"
        value={analytics?.overdueTasks || 0}
      />
      <AnalyticsCard
        isLoading={isPending}
        title="Completed Task"
        value={analytics?.completedTasks || 0}
      />
    </div>
  );
};

export default WorkspaceAnalytics;
