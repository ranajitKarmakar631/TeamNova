import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import {
  checkHasPermission,
  clearAuth,
  fetchCurrentUser,
  fetchMyAssociations,
  fetchWorkspaceById,
  logoutUser,
  PermissionScope,
  selectAuth,
  setAssociations,
  setAuthUser,
  setPermissions,
  setWorkspace,
} from "@/redux/features/auth/authSlice";
import { PermissionType } from "@/constant";
import useWorkspaceId from "./use-workspace-id";
import { AssociationType, UserType, WorkspaceWithMembersType } from "@/types/api.type";

export const useAuthRedux = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const workspaceId = useWorkspaceId();

  const hasPermission = useCallback(
    (permission: PermissionType, scope?: PermissionScope): boolean => {
      return checkHasPermission(
        auth.permissions,
        auth.associations,
        permission,
        scope
      );
    },
    [auth.permissions, auth.associations]
  );

  const refetchAuth = useCallback(() => {
    return dispatch(fetchCurrentUser());
  }, [dispatch]);

  const refetchWorkspace = useCallback(() => {
    if (workspaceId) {
      return dispatch(fetchWorkspaceById(workspaceId));
    }
  }, [dispatch, workspaceId]);

  const refetchAssociations = useCallback(() => {
    if (workspaceId) {
      return dispatch(fetchMyAssociations(workspaceId));
    }
  }, [dispatch, workspaceId]);

  const logout = useCallback(() => {
    return dispatch(logoutUser());
  }, [dispatch]);

  return {
    ...auth,
    hasPermission,
    refetchAuth,
    refetchWorkspace,
    refetchAssociations,
    logout,
    dispatch,
    setAuthUser: (user: UserType | null) => dispatch(setAuthUser(user)),
    setWorkspace: (ws: WorkspaceWithMembersType | null) => dispatch(setWorkspace(ws)),
    setAssociations: (assoc: AssociationType[]) => dispatch(setAssociations(assoc)),
    setPermissions: (perms: PermissionType[] | readonly PermissionType[]) =>
      dispatch(setPermissions([...perms])),
    clearAuth: () => dispatch(clearAuth()),
  };
};

export default useAuthRedux;
