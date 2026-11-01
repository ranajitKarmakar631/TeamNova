/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AssociationType,
  UserType,
  WorkspaceType,
  WorkspaceWithMembersType,
} from "@/types/api.type";
import {
  AssociationRolePermissions,
  AssociationRoleType,
  PermissionType,
  WorkspaceRolePermissions,
  WorkspaceRoleType,
} from "@/constant";
import {
  getCurrentUserQueryFn,
  getMyAssociationsQueryFn,
  getWorkspaceByIdQueryFn,
  logoutMutationFn,
} from "@/lib/api";

export type PermissionScope =
  | { teamId?: string; projectId?: string }
  | AssociationRoleType;

export interface AuthState {
  user: UserType | null;
  workspace: WorkspaceWithMembersType | WorkspaceType | null;
  associations: AssociationType[];
  permissions: PermissionType[];
  isLoading: boolean;
  isFetching: boolean;
  workspaceLoading: boolean;
  error: any | null;
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: AuthState = {
  user: null,
  workspace: null,
  associations: [],
  permissions: [],
  isLoading: true,
  isFetching: false,
  workspaceLoading: false,
  error: null,
  status: "idle",
};

// Helper: Calculate workspace role permissions
export const calculateWorkspacePermissions = (
  user?: UserType | null,
  workspace?: WorkspaceWithMembersType | WorkspaceType | null
): PermissionType[] => {
  if (!user || !workspace) return [];
  const members = (workspace as WorkspaceWithMembersType)?.members;
  if (!members || !Array.isArray(members)) return [];

  const member = members.find((m) => m.userId === user._id);
  if (member) {
    if (member.role?.permissions && member.role.permissions.length > 0) {
      return [...member.role.permissions];
    }
    const roleName = member.role?.name as WorkspaceRoleType;
    const permissions = WorkspaceRolePermissions[roleName] || [];
    return [...permissions];
  }
  return [];
};

// Helper: Check permission against workspace role and associations
export const checkHasPermission = (
  permissions: readonly PermissionType[] | PermissionType[],
  associations: AssociationType[],
  permission: PermissionType,
  scope?: PermissionScope
): boolean => {
  // 1. Check workspace level permissions
  if (permissions.includes(permission)) {
    return true;
  }

  // 2. Direct association role check (e.g., HEAD, LEAD, MEMBER)
  if (typeof scope === "string") {
    const rolePermissions = AssociationRolePermissions[scope] || [];
    return rolePermissions.includes(permission);
  }

  // 3. Scoped check by teamId or projectId
  if (scope && typeof scope === "object") {
    const targetId = scope.teamId || scope.projectId;
    if (targetId) {
      const userAssoc = associations.find(
        (a) => a.scopeId === targetId && a.status === "ACTIVE"
      );
      if (userAssoc && userAssoc.role) {
        const rolePermissions = AssociationRolePermissions[userAssoc.role] || [];
        return rolePermissions.includes(permission);
      }
    }
  }

  return false;
};

// Async Thunks
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCurrentUserQueryFn();
      return response.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchWorkspaceById = createAsyncThunk(
  "auth/fetchWorkspaceById",
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      const response = await getWorkspaceByIdQueryFn(workspaceId);
      return response.workspace;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchMyAssociations = createAsyncThunk(
  "auth/fetchMyAssociations",
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      const response = await getMyAssociationsQueryFn(workspaceId);
      return response.associations || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await logoutMutationFn();
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser: (state, action: PayloadAction<UserType | null>) => {
      state.user = action.payload;
      state.permissions = calculateWorkspacePermissions(state.user, state.workspace);
    },
    setWorkspace: (
      state,
      action: PayloadAction<WorkspaceWithMembersType | WorkspaceType | null>
    ) => {
      state.workspace = action.payload;
      state.permissions = calculateWorkspacePermissions(state.user, state.workspace);
    },
    setAssociations: (state, action: PayloadAction<AssociationType[]>) => {
      state.associations = action.payload;
    },
    setPermissions: (state, action: PayloadAction<PermissionType[]>) => {
      state.permissions = [...action.payload];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setFetching: (state, action: PayloadAction<boolean>) => {
      state.isFetching = action.payload;
    },
    setWorkspaceLoading: (state, action: PayloadAction<boolean>) => {
      state.workspaceLoading = action.payload;
    },
    setError: (state, action: PayloadAction<any>) => {
      state.error = action.payload;
    },
    syncAuthData: (
      state,
      action: PayloadAction<{
        user?: UserType | null;
        workspace?: WorkspaceWithMembersType | WorkspaceType | null;
        associations?: AssociationType[];
        isLoading?: boolean;
        isFetching?: boolean;
        workspaceLoading?: boolean;
        error?: any;
      }>
    ) => {
      const {
        user,
        workspace,
        associations,
        isLoading,
        isFetching,
        workspaceLoading,
        error,
      } = action.payload;

      let permissionsChanged = false;

      if (user !== undefined && (user?._id !== state.user?._id || user?.currentWorkspace?._id !== (state.user?.currentWorkspace as any)?._id)) {
        state.user = user;
        permissionsChanged = true;
      }
      if (workspace !== undefined && workspace?._id !== state.workspace?._id) {
        state.workspace = workspace;
        permissionsChanged = true;
      }
      if (associations !== undefined) {
        const currentIds = state.associations.map((a) => `${a._id}:${a.role}`).join(",");
        const newIds = associations.map((a) => `${a._id}:${a.role}`).join(",");
        if (currentIds !== newIds) {
          state.associations = associations;
        }
      }
      if (isLoading !== undefined && state.isLoading !== isLoading) {
        state.isLoading = isLoading;
      }
      if (isFetching !== undefined && state.isFetching !== isFetching) {
        state.isFetching = isFetching;
      }
      if (workspaceLoading !== undefined && state.workspaceLoading !== workspaceLoading) {
        state.workspaceLoading = workspaceLoading;
      }
      if (error !== undefined && state.error !== error) {
        state.error = error;
      }
      if (permissionsChanged) {
        state.permissions = calculateWorkspacePermissions(state.user, state.workspace);
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.workspace = null;
      state.associations = [];
      state.permissions = [];
      state.isLoading = false;
      state.isFetching = false;
      state.workspaceLoading = false;
      state.error = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    // Current User
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.status = "loading";
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.status = "succeeded";
        state.permissions = calculateWorkspacePermissions(state.user, state.workspace);
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.status = "failed";
        state.error = action.payload;
      });

    // Workspace
    builder
      .addCase(fetchWorkspaceById.pending, (state) => {
        state.workspaceLoading = true;
      })
      .addCase(fetchWorkspaceById.fulfilled, (state, action) => {
        state.workspaceLoading = false;
        state.workspace = action.payload;
        state.permissions = calculateWorkspacePermissions(state.user, state.workspace);
      })
      .addCase(fetchWorkspaceById.rejected, (state, action) => {
        state.workspaceLoading = false;
        state.error = action.payload;
      });

    // Associations
    builder
      .addCase(fetchMyAssociations.fulfilled, (state, action) => {
        state.associations = action.payload;
      })
      .addCase(fetchMyAssociations.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.workspace = null;
      state.associations = [];
      state.permissions = [];
      state.isLoading = false;
      state.isFetching = false;
      state.workspaceLoading = false;
      state.error = null;
      state.status = "idle";
    });
  },
});

export const {
  setAuthUser,
  setWorkspace,
  setAssociations,
  setPermissions,
  setLoading,
  setFetching,
  setWorkspaceLoading,
  setError,
  syncAuthData,
  clearAuth,
} = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectCurrentWorkspace = (state: { auth: AuthState }) => state.auth.workspace;
export const selectAssociations = (state: { auth: AuthState }) => state.auth.associations;
export const selectPermissions = (state: { auth: AuthState }) => state.auth.permissions;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthFetching = (state: { auth: AuthState }) => state.auth.isFetching;
export const selectWorkspaceLoading = (state: { auth: AuthState }) => state.auth.workspaceLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

export default authSlice.reducer;
