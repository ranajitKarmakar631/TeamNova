import { DashboardSkeleton } from "@/components/skeleton-loaders/dashboard-skeleton";
import useAuth from "@/hooks/api/use-auth";
import { Navigate, Outlet } from "react-router-dom";
import { PROTECTED_ROUTES } from "./common/routePaths";

const AuthRoute = () => {
  const { data: authData, isLoading } = useAuth();
  const user = authData?.user;

  if (isLoading) return <DashboardSkeleton />;

  if (!user) return <Outlet />;

  const workspaceId =
    typeof user.currentWorkspace === "string"
      ? user.currentWorkspace
      : user.currentWorkspace?._id;

  // if user do not have any workspace then redirect to CREATE_WORKSPACE
  if (!workspaceId) {
    return <Navigate to={PROTECTED_ROUTES.CREATE_WORKSPACE} replace />;
  }

  // if user have workspace then redirect to /workspace/:workspaceId
  return <Navigate to={`/workspace/${workspaceId}`} replace />;
};

export default AuthRoute;