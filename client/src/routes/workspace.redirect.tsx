import { DashboardSkeleton } from "@/components/skeleton-loaders/dashboard-skeleton";
import { useAuth } from "@/features/auth";
import { Navigate } from "react-router-dom";
import { PROTECTED_ROUTES } from "./common/routePaths";

const WorkspaceRedirect = () => {
  const { data: authData, isLoading } = useAuth();
  const user = authData?.user;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const workspaceId =
    typeof user.currentWorkspace === "string"
      ? user.currentWorkspace
      : user.currentWorkspace?._id;
  if (!workspaceId) {
    return <Navigate to={PROTECTED_ROUTES.CREATE_WORKSPACE} replace />;
  }

  return <Navigate to={`/workspace/${workspaceId}`} replace />;

};

export default WorkspaceRedirect;
