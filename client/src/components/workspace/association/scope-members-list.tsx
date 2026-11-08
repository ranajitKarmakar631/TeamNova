import { useState } from "react";
import {
  Users,
  Shield,
  Crown,
  UserPlus,
  Loader,
  MoreHorizontal,
  Trash2,
  Check,
  ChevronDown,
  UserCheck,
  Search,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import useDebounce from "@/hooks/use-debounce";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/resuable/confirm-dialog";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useAuthContext } from "@/context/auth-provider";
import {
  useScopeMembersQuery as useGetScopeMembers,
  useAvailableScopeMembersQuery as useGetAvailableScopeMembers,
  useScopeMemberMutations,
  AssociationScopeType,
  ScopeMemberType,
} from "@/features/association";
import {
  AssociationRoles,
  AssociationRoleType,
  WorkspaceRoles,
} from "@/constant";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { format } from "date-fns";

interface ScopeMembersListProps {
  scopeType: AssociationScopeType;
  scopeId: string;
  scopeTitle?: string;
  readOnly?: boolean;
}

const ROLE_BADGE_CONFIG: Record<
  AssociationRoleType,
  { label: string; className: string; icon: typeof Crown }
> = {
  [AssociationRoles.HEAD]: {
    label: "Head",
    className:
      "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20",
    icon: Crown,
  },
  [AssociationRoles.LEAD]: {
    label: "Lead",
    className:
      "border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20",
    icon: Shield,
  },
  [AssociationRoles.MEMBER]: {
    label: "Member",
    className:
      "border-slate-300 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20",
    icon: Users,
  },
};

export const ScopeMembersList = ({
  scopeType,
  scopeId,
  scopeTitle = "",
  readOnly = false,
}: ScopeMembersListProps) => {
  const workspaceId = useWorkspaceId();
  const { user, workspace } = useAuthContext();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<AssociationRoleType>(
    AssociationRoles.MEMBER
  );
  const [memberToRemove, setMemberToRemove] = useState<ScopeMemberType | null>(
    null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Queries (with debounced search performed on the backend)
  const { data: scopeData, isLoading: isScopeLoading, isFetching: isScopeFetching } = useGetScopeMembers({
    workspaceId,
    scopeType,
    scopeId,
    search: debouncedSearch.trim() || undefined,
  });

  // Fetch members available to join, filtered on the backend
  const {
    data: availableData,
    isLoading: isAvailableLoading,
  } = useGetAvailableScopeMembers({
    workspaceId,
    scopeType,
    scopeId,
  });

  // Mutations
  const {
    assignMemberMutation,
    updateRoleMutation,
    removeMemberMutation,
  } = useScopeMemberMutations({
    workspaceId,
    scopeType,
    scopeId,
  });

  const members = scopeData?.members || [];
  const roleStats = scopeData?.roleStats || {
    HEAD: 0,
    LEAD: 0,
    MEMBER: 0,
  };

  // Determine permissions
  const currentUserWorkspaceRole = workspace?.role?.name?.toUpperCase();
  const isWorkspaceAdminOrOwner =
    currentUserWorkspaceRole === WorkspaceRoles.OWNER ||
    currentUserWorkspaceRole === WorkspaceRoles.ADMIN ||
    currentUserWorkspaceRole === "OWNER" ||
    currentUserWorkspaceRole === "ADMIN";

  const userAssociation = members.find(
    (m) => m.memberId?.userId?._id === user?._id
  );

  // Backend determines if current user is already joined (directly or via team)
  const isUserJoined =
    availableData?.isCurrentUserJoined ??
    Boolean(userAssociation && userAssociation.status === "ACTIVE");
  const joinedVia = availableData?.joinedVia;

  const isScopeHeadOrLead =
    userAssociation?.role === AssociationRoles.HEAD ||
    userAssociation?.role === AssociationRoles.LEAD;
  const isScopeCreator = (scopeData as any)?.createdBy === user?._id;

  const canManageMembers =
    !readOnly && (isWorkspaceAdminOrOwner || isScopeHeadOrLead || isScopeCreator);

  // Available workspace members returned directly from backend (no client-side filtering)
  const availableWorkspaceMembers = availableData?.members || [];

  const handleJoinScope = () => {
    if (!user?._id) return;
    assignMemberMutation.mutate({
      userId: user._id,
      role: isScopeCreator ? AssociationRoles.HEAD : AssociationRoles.MEMBER,
    });
  };

  const handleAddMember = () => {
    if (!selectedMemberId) return;

    assignMemberMutation.mutate(
      {
        memberId: selectedMemberId,
        role: selectedRole,
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          setSelectedMemberId("");
          setSelectedRole(AssociationRoles.MEMBER);
        },
      }
    );
  };

  const handleRoleChange = (member: ScopeMemberType, newRole: AssociationRoleType) => {
    if (member.role === newRole) return;
    updateRoleMutation.mutate({
      memberId: member.memberId?._id,
      userId: member.memberId?.userId?._id,
      role: newRole,
    });
  };

  const handleConfirmRemove = () => {
    if (!memberToRemove) return;
    removeMemberMutation.mutate(
      {
        memberId: memberToRemove.memberId?._id,
        userId: memberToRemove.memberId?.userId?._id,
      },
      {
        onSuccess: () => {
          setMemberToRemove(null);
        },
      }
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">
              {scopeType === "TEAM" ? "Team Members" : "Project Members"}
            </h3>
            <Badge variant="secondary" className="font-normal text-xs">
              {members.length} {members.length === 1 ? "member" : "members"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage contributors, team leads, and roles in this {scopeType.toLowerCase()}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role summary pills */}
          <div className="flex items-center gap-1.5 text-xs">
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
            >
              <Crown className="w-3 h-3" />
              <span>{roleStats.HEAD} Head</span>
            </Badge>
            <Badge
              variant="outline"
              className="gap-1 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
            >
              <Shield className="w-3 h-3" />
              <span>{roleStats.LEAD} Lead</span>
            </Badge>
            <Badge
              variant="outline"
              className="gap-1 border-slate-300 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20"
            >
              <Users className="w-3 h-3" />
              <span>{roleStats.MEMBER} Member</span>
            </Badge>
          </div>

          {joinedVia === "TEAM" && (
            <Badge
              variant="outline"
              className="text-xs font-normal border-dashed border-indigo-400/40 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20 py-1 px-2.5 ml-auto sm:ml-2"
            >
              Joined via Team
            </Badge>
          )}

          {!readOnly && !isUserJoined && (
            <Button
              onClick={handleJoinScope}
              size="sm"
              className="gap-1.5 ml-auto sm:ml-2"
              disabled={assignMemberMutation.isPending}
            >
              <UserCheck className="h-4 w-4" />
              <span>Join {scopeType === "TEAM" ? "Team" : "Project"}</span>
            </Button>
          )}

          {canManageMembers && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
              variant={!isUserJoined ? "outline" : "default"}
              className="gap-1.5 ml-auto sm:ml-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Member</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9 bg-card"
          />
        </div>
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="text-xs h-9 gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </Button>
        )}
        {isScopeFetching && !isScopeLoading && (
          <Loader className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />
        )}
      </div>

      {/* Member List */}
      <div className="rounded-xl border bg-card overflow-hidden divide-y divide-border">
        {isScopeLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">
              {searchQuery ? "No matching members found" : "No members assigned yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery
                ? `No members matched "${searchQuery}". Try a different search.`
                : `Add workspace members to collaborate in this ${scopeType.toLowerCase()}.`}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              {searchQuery ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Search</span>
                </Button>
              ) : (
                <>
                  {!readOnly && !isUserJoined && (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={handleJoinScope}
                      disabled={assignMemberMutation.isPending}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Join {scopeType === "TEAM" ? "Team" : "Project"}
                    </Button>
                  )}
                  {canManageMembers && (
                    <Button
                      variant={!isUserJoined ? "outline" : "default"}
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Assign Member
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          members.map((member) => {
            const memberUser = member.memberId?.userId;
            const name = memberUser?.name || "Unknown Member";
            const email = memberUser?.email || "";
            const initials = getAvatarFallbackText(name);
            const avatarColor = getAvatarColor(name);
            const roleConfig = ROLE_BADGE_CONFIG[member.role] || ROLE_BADGE_CONFIG.MEMBER;
            const RoleIcon = roleConfig.icon;
            const isSelf = memberUser?._id === user?._id;
            const canEditThisMember = canManageMembers && (!isSelf || isWorkspaceAdminOrOwner);

            return (
              <div
                key={member._id}
                className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={memberUser?.profilePicture || ""} alt={name} />
                    <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {name}
                      </p>
                      {isSelf && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {/* Joined Date (hidden on mobile) */}
                  {member.createdAt && (
                    <span className="text-xs text-muted-foreground hidden md:inline-block">
                      Joined {format(new Date(member.createdAt), "MMM d, yyyy")}
                    </span>
                  )}

                  {/* Role Selector or Badge */}
                  {canEditThisMember ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-7 px-2.5 text-xs gap-1.5 font-medium capitalize ${roleConfig.className}`}
                          disabled={updateRoleMutation.isPending}
                        >
                          <RoleIcon className="w-3 h-3" />
                          <span>{roleConfig.label}</span>
                          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        {(Object.values(AssociationRoles) as AssociationRoleType[]).map((role) => (
                          <DropdownMenuItem
                            key={role}
                            className="text-xs cursor-pointer justify-between capitalize"
                            onClick={() => handleRoleChange(member, role)}
                          >
                            <span>{role.toLowerCase()}</span>
                            {member.role === role && <Check className="w-3.5 h-3.5 text-primary" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Badge
                      variant="outline"
                      className={`gap-1 font-medium text-xs py-0.5 ${roleConfig.className}`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      <span>{roleConfig.label}</span>
                    </Badge>
                  )}

                  {/* Actions */}
                  {(canEditThisMember || isSelf) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => setMemberToRemove(member)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          {isSelf
                            ? `Leave ${scopeType.toLowerCase()}`
                            : `Remove from ${scopeType.toLowerCase()}`}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Member to {scopeType === "TEAM" ? "Team" : "Project"}</DialogTitle>
            <DialogDescription>
              Select a workspace member to add to {scopeTitle || `this ${scopeType.toLowerCase()}`}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Workspace Member
              </label>
              {isAvailableLoading ? (
                <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading available members...</span>
                </div>
              ) : availableWorkspaceMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-2">
                  {scopeType === "PROJECT"
                    ? "All workspace members are already part of this project (directly or through assigned teams)."
                    : "All workspace members are already assigned to this team."}
                </p>
              ) : (
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choose a member..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableWorkspaceMembers.map((m: any) => {
                      const mUser = m.userId;
                      return (
                        <SelectItem key={m._id} value={m._id}>
                          <div className="flex items-center gap-2">
                            <span>{mUser?.name || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">({mUser?.email})</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Role in {scopeType === "TEAM" ? "Team" : "Project"}
              </label>
              <Select
                value={selectedRole}
                onValueChange={(val) => setSelectedRole(val as AssociationRoleType)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AssociationRoles.HEAD}>
                    <div className="flex flex-col text-left py-0.5">
                      <span className="font-medium text-sm flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-500" /> Head
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Full lead management over tasks and members
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value={AssociationRoles.LEAD}>
                    <div className="flex flex-col text-left py-0.5">
                      <span className="font-medium text-sm flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-indigo-500" /> Lead
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Can coordinate tasks, edit status, and assign work
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value={AssociationRoles.MEMBER}>
                    <div className="flex flex-col text-left py-0.5">
                      <span className="font-medium text-sm flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" /> Member
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Standard contributor on tasks and activities
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddMember}
              disabled={!selectedMemberId || assignMemberMutation.isPending}
              className="gap-1.5"
            >
              {assignMemberMutation.isPending ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              <span>Assign</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove / Leave Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(memberToRemove)}
        isLoading={removeMemberMutation.isPending}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
        title={
          memberToRemove?.memberId?.userId?._id === user?._id
            ? `Leave ${scopeType === "TEAM" ? "Team" : "Project"}`
            : `Remove from ${scopeType === "TEAM" ? "Team" : "Project"}`
        }
        description={
          memberToRemove?.memberId?.userId?._id === user?._id
            ? `Are you sure you want to leave ${scopeTitle || `this ${scopeType.toLowerCase()}`}?`
            : `Are you sure you want to remove "${memberToRemove?.memberId?.userId?.name || "this member"}" from ${scopeTitle || `this ${scopeType.toLowerCase()}`}?`
        }
        confirmText={
          memberToRemove?.memberId?.userId?._id === user?._id
            ? "Leave"
            : "Remove Member"
        }
        cancelText="Cancel"
      />
    </div>
  );
};

export default ScopeMembersList;
