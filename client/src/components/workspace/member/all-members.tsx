import { useState } from "react";
import { Check, ChevronDown, Loader } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { useAuthContext } from "@/context/auth-provider";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeWorkspaceMemberRoleMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Permissions, WorkspaceRoles } from "@/constant";

const ROLE_DESCRIPTIONS: Record<string, string> = {
  [WorkspaceRoles.ADMIN]:
    "Can view, create, edit tasks, projects, members, teams and manage settings.",
  [WorkspaceRoles.MANAGER]:
    "Can view, create, and edit tasks, teams, and view projects and members.",
  [WorkspaceRoles.EMPLOYEE]:
    "Can view tasks, projects, teams, members, and edit assigned tasks.",
  MEMBER: "Can view and edit only tasks created by or assigned to them.",
};

const ROLE_ORDER: Record<string, number> = {
  [WorkspaceRoles.ADMIN]: 1,
  [WorkspaceRoles.MANAGER]: 2,
  [WorkspaceRoles.EMPLOYEE]: 3,
};

const AllMembers = () => {
  const { user, hasPermission } = useAuthContext();
  const canChangeMemberRole = hasPermission(Permissions.CHANGE_MEMBER_ROLE);

  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const { data, isPending } = useGetWorkspaceMembers(workspaceId);
  const members = data?.members || [];
  const roles = data?.roles || [];

  // Filter selectable roles according to the Workspace model
  const selectableRoles = roles
    ?.filter((role) => {
      if (role.name === WorkspaceRoles.OWNER || role.name === "OWNER") {
        return false;
      }
      return (
        role.name === WorkspaceRoles.ADMIN ||
        role.name === WorkspaceRoles.MANAGER ||
        role.name === WorkspaceRoles.EMPLOYEE ||
        (role.name === "MEMBER" &&
          !roles.some((r) => r.name === WorkspaceRoles.EMPLOYEE))
      );
    })
    .sort((a, b) => {
      const orderA = ROLE_ORDER[a.name] ?? 99;
      const orderB = ROLE_ORDER[b.name] ?? 99;
      return orderA - orderB;
    });

  const { mutate } = useMutation({
    mutationFn: changeWorkspaceMemberRoleMutationFn,
  });

  const handleSelect = (roleId: string, memberUserId: string) => {
    if (!roleId || !memberUserId) return;
    setOpenPopoverId(null);
    setUpdatingMemberId(memberUserId);

    const payload = {
      workspaceId,
      data: {
        roleId,
        memberId: memberUserId,
      },
    };

    mutate(payload, {
      onSuccess: () => {
        setUpdatingMemberId(null);
        queryClient.invalidateQueries({
          queryKey: ["members", workspaceId],
        });
        toast({
          title: "Success",
          description: "Member's role changed successfully",
          variant: "success",
        });
      },
      onError: (error: any) => {
        setUpdatingMemberId(null);
        toast({
          title: "Error",
          description:
            error?.response?.data?.message ||
            error.message ||
            "Failed to change member role",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="grid gap-6 pt-2">
      {isPending ? (
        <Loader className="w-8 h-8 animate-spin place-self-center flex" />
      ) : null}

      {members?.map((member) => {
        const memberUserId = member.userId?._id;
        const name = member.userId?.name || "Unknown Member";
        const email = member.userId?.email || "";
        const initials = getAvatarFallbackText(name);
        const avatarColor = getAvatarColor(name);

        const currentRoleName = member.role?.name?.toUpperCase();
        const isOwner =
          currentRoleName === "OWNER" ||
          currentRoleName === WorkspaceRoles.OWNER;
        const isSelf = memberUserId === user?._id;
        const canEditMember = canChangeMemberRole && !isSelf && !isOwner;
        const isMemberUpdating = updatingMemberId === memberUserId;

        return (
          <div
            key={member._id || memberUserId}
            className="flex items-center justify-between space-x-4"
          >
            <div className="flex items-center space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={member.userId?.profilePicture || ""}
                  alt={name}
                />
                <AvatarFallback className={avatarColor}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">{name}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Popover
                open={openPopoverId === member._id}
                onOpenChange={(open) =>
                  setOpenPopoverId(open ? member._id : null)
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto min-w-24 capitalize disabled:opacity-95 disabled:pointer-events-none"
                    disabled={isMemberUpdating || !canEditMember}
                  >
                    {isMemberUpdating ? (
                      <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        {member.role?.name?.toLowerCase() || "employee"}
                        {canEditMember && (
                          <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
                        )}
                      </>
                    )}
                  </Button>
                </PopoverTrigger>

                {canEditMember && (
                  <PopoverContent className="p-0 w-72" align="end">
                    <Command>
                      <CommandInput
                        placeholder="Select new role..."
                        disabled={isMemberUpdating}
                        className="disabled:pointer-events-none"
                      />
                      <CommandList>
                        {isMemberUpdating ? (
                          <Loader className="w-8 h-8 animate-spin place-self-center flex my-4" />
                        ) : (
                          <>
                            <CommandEmpty>No roles found.</CommandEmpty>
                            <CommandGroup>
                              {selectableRoles?.map((role) => {
                                const isSelected =
                                  role._id === member.role?._id ||
                                  role.name?.toUpperCase() === currentRoleName;

                                return (
                                  <CommandItem
                                    key={role._id}
                                    disabled={isMemberUpdating}
                                    className="disabled:pointer-events-none gap-1 mb-1 flex items-start justify-between px-3 py-2 cursor-pointer"
                                    onSelect={() => {
                                      if (isSelected) {
                                        setOpenPopoverId(null);
                                        return;
                                      }
                                      handleSelect(role._id, memberUserId);
                                    }}
                                  >
                                    <div className="flex flex-col items-start pr-2">
                                      <p className="capitalize font-medium text-sm">
                                        {role.name?.toLowerCase()}
                                      </p>
                                      <p className="text-xs text-muted-foreground leading-snug">
                                        {ROLE_DESCRIPTIONS[role.name] ||
                                          "Workspace member role"}
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    )}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                )}
              </Popover>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AllMembers;
