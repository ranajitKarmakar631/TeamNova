import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./protected.route";
import AuthRoute from "./auth.route";
import WorkspaceRedirect from "./workspace.redirect";
import {
  authenticationRoutePaths,
  baseRoutePaths,
  protectedRoutePaths,
} from "./common/routes";
import { PROTECTED_ROUTES } from "./common/routePaths";
import AppLayout from "@/layout/app.layout";
import BaseLayout from "@/layout/base.layout";
import NotFound from "@/page/errors/NotFound";
import AddWorkspace from "@/components/add-workspace";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Base / Public layout routes */}
        <Route element={<BaseLayout />}>
          {baseRoutePaths.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>

        {/* Authentication routes */}
        <Route element={<AuthRoute />}>
          <Route element={<BaseLayout />}>
            {authenticationRoutePaths.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
          </Route>
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* If user visits /workspace directly, redirect to /workspace/:workspaceId or CREATE_WORKSPACE */}
          <Route path="/workspace" element={<WorkspaceRedirect />} />

          {/* Standalone create workspace page */}
          <Route element={<BaseLayout />}>
            <Route
              path={PROTECTED_ROUTES.CREATE_WORKSPACE}
              element={<AddWorkspace />}
            />
          </Route>

          {/* Workspace app layout routes */}
          <Route element={<AppLayout />}>
            {protectedRoutePaths.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
          </Route>
        </Route>

        {/* Catch-all for undefined routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
