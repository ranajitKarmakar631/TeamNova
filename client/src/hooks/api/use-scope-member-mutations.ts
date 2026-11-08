import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignMemberToScopeMutationFn,
  updateMemberRoleMutationFn,
  removeMemberFromScopeMutationFn,
} from "@/lib/api";
import {
  AssignMemberPayloadType,
  UpdateMemberRolePayloadType,
  RemoveMemberPayloadType,
  AssociationScopeType,
} from "@/types/api.type";
import { toast } from "@/hooks/use-toast";

export const useScopeMemberMutations = ({
  workspaceId,
  scopeType,
  scopeId,
}: {
  workspaceId: string;
  scopeType: AssociationScopeType;
  scopeId: string;
}) => {
  const queryClient = useQueryClient();

  const invalidateScopeData = () => {
    queryClient.invalidateQueries({
      queryKey: ["scope-members", scopeType, scopeId],
    });
    queryClient.invalidateQueries({
      queryKey: ["available-scope-members"],
    });
    queryClient.invalidateQueries({
      queryKey: ["my-associations", workspaceId],
    });
    if (scopeType === "TEAM") {
      queryClient.invalidateQueries({
        queryKey: ["all-teams", workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["team-detail", scopeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-teams"],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-members"],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-overview"],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-analytics"],
      });
    } else if (scopeType === "PROJECT") {
      queryClient.invalidateQueries({
        queryKey: ["allprojects", workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["singleProject", scopeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-members", scopeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-overview", scopeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-teams", scopeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-teams", workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-analytics", scopeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["workspace-analytics", workspaceId],
      });
    }
  };

  const assignMemberMutation = useMutation({
    mutationFn: (data: Omit<AssignMemberPayloadType, "workspaceId" | "scopeType" | "scopeId">) =>
      assignMemberToScopeMutationFn({
        workspaceId,
        scopeType,
        scopeId,
        ...data,
      }),
    onSuccess: (data) => {
      invalidateScopeData();
      toast({
        title: "Success",
        description: data.message || "Member added successfully",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          error.message ||
          "Failed to add member to " + scopeType.toLowerCase(),
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (data: Omit<UpdateMemberRolePayloadType, "workspaceId" | "scopeType" | "scopeId">) =>
      updateMemberRoleMutationFn({
        workspaceId,
        scopeType,
        scopeId,
        ...data,
      }),
    onSuccess: (data) => {
      invalidateScopeData();
      toast({
        title: "Success",
        description: data.message || "Role updated successfully",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          error.message ||
          "Failed to update member role",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (data: Omit<RemoveMemberPayloadType, "workspaceId" | "scopeType" | "scopeId">) =>
      removeMemberFromScopeMutationFn({
        workspaceId,
        scopeType,
        scopeId,
        ...data,
      }),
    onSuccess: (data) => {
      invalidateScopeData();
      toast({
        title: "Success",
        description: data.message || "Member removed successfully",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          error.message ||
          "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  return {
    assignMemberMutation,
    updateRoleMutation,
    removeMemberMutation,
    invalidateScopeData,
  };
};

export default useScopeMemberMutations;

