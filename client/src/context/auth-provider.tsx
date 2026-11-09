/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useMemo, useCallback } from "react";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useAuth, UserType } from "@/features/auth";
import { useWorkspaceQuery as useGetWorkspaceQuery, WorkspaceWithMembersType } from "@/features/workspace";
import { useNavigate } from "react-router-dom";
import { PermissionType } from "@/constant";
import { useGetMyAssociations, AssociationType } from "@/features/association";
import usePermissions from "@/hooks/use-permissions";
import { useAppDispatch } from "@/redux/store";
import {
  checkHasPermission,
  PermissionScope,
  syncAuthData,
} from "@/redux/features/auth/authSlice";

export type { PermissionScope };

// Define the context shape
export type AuthContextType = {
  user?: UserType | null;
  workspace?: WorkspaceWithMembersType | any;
  associations: AssociationType[];
  permissions: PermissionType[];
  hasPermission: (
    permission: PermissionType,
    scope?: PermissionScope
  ) => boolean;
  error: any;
  isLoading: boolean;
  isFetching: boolean;
  workspaceLoading: boolean;
  refetchAuth: () => void;
  refetchWorkspace: () => void;
  refetchAssociations: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const dispatch = useAppDispatch();

  // Fetch queries
  const {
    data: authData,
    error: authError,
    isLoading: isAuthLoading,
    isFetching: isAuthFetching,
    refetch: refetchAuth,
  } = useAuth();
  const user = authData?.user;

  const {
    data: workspaceData,
    isLoading: workspaceLoading,
    error: workspaceError,
    refetch: refetchWorkspace,
  } = useGetWorkspaceQuery(workspaceId);
  const workspace = workspaceData?.workspace;

  const {
    data: associationsData,
    refetch: refetchAssociations,
  } = useGetMyAssociations(workspaceId);
  const associations = associationsData?.associations;

  // Calculate permissions
  const permissions = usePermissions(user, workspace);

  // Sync state into Redux store (only when data changes)
  useEffect(() => {
    dispatch(
      syncAuthData({
        user: user || null,
        workspace: workspace || null,
        associations: associations || [],
        isLoading: isAuthLoading,
        isFetching: isAuthFetching,
        workspaceLoading,
        error: authError || workspaceError || null,
      })
    );
  }, [
    dispatch,
    user,
    workspace,
    associations,
    isAuthLoading,
    isAuthFetching,
    workspaceLoading,
    authError,
    workspaceError,
  ]);

  // Handle unauthorized error redirect
  useEffect(() => {
    if (workspaceError) {
      if (workspaceError?.errorCode === "ACCESS_UNAUTHORIZED") {
        navigate("/");
      }
    }
  }, [navigate, workspaceError]);

  const hasPermission = useCallback(
    (permission: PermissionType, scope?: PermissionScope): boolean => {
      return checkHasPermission(
        permissions,
        associations || [],
        permission,
        scope
      );
    },
    [permissions, associations]
  );

  const contextValue: AuthContextType = useMemo(
    () => ({
      user,
      workspace,
      associations: associations || [],
      permissions: permissions as PermissionType[],
      hasPermission,
      error: authError || workspaceError || null,
      isLoading: isAuthLoading,
      isFetching: isAuthFetching,
      workspaceLoading,
      refetchAuth,
      refetchWorkspace,
      refetchAssociations,
    }),
    [
      user,
      workspace,
      associations,
      permissions,
      hasPermission,
      authError,
      workspaceError,
      isAuthLoading,
      isAuthFetching,
      workspaceLoading,
      refetchAuth,
      refetchWorkspace,
      refetchAssociations,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
