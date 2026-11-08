import { DashboardSkeleton } from "@/components/skeleton-loaders/dashboard-skeleton";
import { useAuth } from "@/features/auth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PROTECTED_ROUTES } from "./common/routePaths";

const ProtectedRoute = () => {
  const location = useLocation();
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

  // if user do not have any workspace then redirect to CREATE_WORKSPACE
  if (!workspaceId && location.pathname !== PROTECTED_ROUTES.CREATE_WORKSPACE) {
    return <Navigate to={PROTECTED_ROUTES.CREATE_WORKSPACE} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
