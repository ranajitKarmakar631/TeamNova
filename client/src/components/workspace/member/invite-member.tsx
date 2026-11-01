import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/context/auth-provider";
import { toast } from "@/hooks/use-toast";
import {
  CheckIcon,
  CopyIcon,
  Loader,
  Mail,
  Link as LinkIcon,
  Sparkles,
  Users,
  Trash2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { BASE_ROUTE } from "@/routes/common/routePaths";
import PermissionsGuard from "@/components/resuable/permission-guard";
import { Permissions, WorkspaceRoles } from "@/constant";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEmailInviteMutationFn,
  createLinkInviteMutationFn,
  getWorkspaceInvitationsQueryFn,
  revokeInvitationMutationFn,
} from "@/lib/api";

const InviteMember = () => {
  const { workspace, workspaceLoading } = useAuthContext();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("email");

  // Email form state
  const [email, setEmail] = useState("");
  const [emailRole, setEmailRole] = useState<string>(WorkspaceRoles.EMPLOYEE);
  const [emailExpiryDays, setEmailExpiryDays] = useState("7");

  // Link generator state
  const [linkRole, setLinkRole] = useState<string>(WorkspaceRoles.EMPLOYEE);
  const [linkMaxUses, setLinkMaxUses] = useState<string>("unlimited");
  const [linkExpiryDays, setLinkExpiryDays] = useState("7");
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Default workspace invite code copy state
  const [defaultCopied, setDefaultCopied] = useState(false);

  const defaultInviteUrl = workspace
    ? `${window.location.origin}${BASE_ROUTE.INVITE_URL.replace(
        ":inviteCode",
        workspace.inviteCode
      )}`
    : "";

  // Query workspace invitations
  const {
    data: invitationsData,
    isLoading: isInvitationsLoading,
  } = useQuery({
    queryKey: ["workspaceInvitations", workspace?._id],
    queryFn: () => getWorkspaceInvitationsQueryFn(workspace?._id!),
    enabled: !!workspace?._id,
  });

  const invitations = invitationsData?.invitations || [];

  // Email invite mutation
  const { mutate: sendEmailInvite, isPending: isSendingEmail } = useMutation({
    mutationFn: createEmailInviteMutationFn,
    onSuccess: (data) => {
      toast({
        title: "Invitation sent!",
        description: data.message || `Invitation email sent to ${email}`,
        variant: "success",
      });
      setEmail("");
      queryClient.invalidateQueries({
        queryKey: ["workspaceInvitations", workspace?._id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitation",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Could not send email invitation",
        variant: "destructive",
      });
    },
  });

  // Link invite mutation
  const { mutate: generateLinkInvite, isPending: isGeneratingLink } = useMutation(
    {
      mutationFn: createLinkInviteMutationFn,
      onSuccess: (data) => {
        setGeneratedLink(data.inviteUrl);
        toast({
          title: "Invite link created!",
          description: "Your custom shareable invitation link is ready",
          variant: "success",
        });
        queryClient.invalidateQueries({
          queryKey: ["workspaceInvitations", workspace?._id],
        });
      },
      onError: (error: any) => {
        toast({
          title: "Failed to generate link",
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Could not create invitation link",
          variant: "destructive",
        });
      },
    }
  );

  // Revoke invitation mutation
  const { mutate: revokeInvite, isPending: isRevoking } = useMutation({
    mutationFn: revokeInvitationMutationFn,
    onSuccess: () => {
      toast({
        title: "Invitation revoked",
        description: "The invitation has been successfully revoked",
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["workspaceInvitations", workspace?._id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to revoke invitation",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Could not revoke invitation",
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace?._id || !email.trim()) return;

    sendEmailInvite({
      workspaceId: workspace._id,
      email: email.trim(),
      role: emailRole,
      expiresInDays: Number(emailExpiryDays),
    });
  };

  const handleGenerateLink = () => {
    if (!workspace?._id) return;

    generateLinkInvite({
      workspaceId: workspace._id,
      role: linkRole,
      maxUses: linkMaxUses === "unlimited" ? null : Number(linkMaxUses),
      expiresInDays: Number(linkExpiryDays),
    });
  };

  const copyToClipboard = (text: string, setStatus: (val: boolean) => void) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setStatus(true);
      toast({
        title: "Copied!",
        description: "Invitation link copied to clipboard",
        variant: "success",
      });
      setTimeout(() => setStatus(false), 2000);
    });
  };

  return (
    <div className="flex flex-col pt-0.5 px-0 space-y-4">
      <div>
        <h5 className="text-lg leading-[30px] font-semibold mb-1 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Invite Members to Workspace
        </h5>
        <p className="text-sm text-muted-foreground leading-tight">
          Invite teammates by email or generate custom shareable links with
          tailored roles and permissions.
        </p>
      </div>

      <PermissionsGuard
        showMessage
        requiredPermission={Permissions.INVITE_MEMBER}
      >
        {workspaceLoading ? (
          <Loader className="w-8 h-8 animate-spin place-self-center flex my-6" />
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-4"
          >
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Invite
              </TabsTrigger>
              <TabsTrigger value="link" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Link Invite
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Invited ({invitations.length})
              </TabsTrigger>
            </TabsList>

            {/* EMAIL INVITATION TAB */}
            <TabsContent value="email" className="space-y-4 mt-2">
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6 space-y-1.5">
                    <Label htmlFor="inviteEmail">Teammate Email</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      required
                      placeholder="colleague@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label htmlFor="emailRole">Role</Label>
                    <Select value={emailRole} onValueChange={setEmailRole}>
                      <SelectTrigger id="emailRole">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={WorkspaceRoles.EMPLOYEE}>
                          Employee
                        </SelectItem>
                        <SelectItem value={WorkspaceRoles.MANAGER}>
                          Manager
                        </SelectItem>
                        <SelectItem value={WorkspaceRoles.ADMIN}>
                          Admin
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label htmlFor="emailExpiry">Expires In</Label>
                    <Select
                      value={emailExpiryDays}
                      onValueChange={setEmailExpiryDays}
                    >
                      <SelectTrigger id="emailExpiry">
                        <SelectValue placeholder="Expires in" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Days</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                    An email containing a secure one-time invite token will be
                    sent directly.
                  </p>
                  <Button
                    type="submit"
                    disabled={isSendingEmail || !email.trim()}
                    className="shrink-0"
                  >
                    {isSendingEmail ? (
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Send Invitation
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* LINK INVITATION TAB */}
            <TabsContent value="link" className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4 space-y-1.5">
                  <Label htmlFor="linkRole">Assigned Role</Label>
                  <Select value={linkRole} onValueChange={setLinkRole}>
                    <SelectTrigger id="linkRole">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={WorkspaceRoles.EMPLOYEE}>
                        Employee
                      </SelectItem>
                      <SelectItem value={WorkspaceRoles.MANAGER}>
                        Manager
                      </SelectItem>
                      <SelectItem value={WorkspaceRoles.ADMIN}>
                        Admin
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <Label htmlFor="linkMaxUses">Max Uses</Label>
                  <Select
                    value={linkMaxUses}
                    onValueChange={setLinkMaxUses}
                  >
                    <SelectTrigger id="linkMaxUses">
                      <SelectValue placeholder="Max uses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlimited">Unlimited Uses</SelectItem>
                      <SelectItem value="1">1 Use Only</SelectItem>
                      <SelectItem value="5">5 Uses</SelectItem>
                      <SelectItem value="10">10 Uses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <Label htmlFor="linkExpiry">Expires In</Label>
                  <Select
                    value={linkExpiryDays}
                    onValueChange={setLinkExpiryDays}
                  >
                    <SelectTrigger id="linkExpiry">
                      <SelectValue placeholder="Expires in" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="14">14 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Generate tokens configured with predefined roles and usage
                  caps.
                </p>
                <Button
                  type="button"
                  onClick={handleGenerateLink}
                  disabled={isGeneratingLink}
                  variant="outline"
                >
                  {isGeneratingLink ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <LinkIcon className="w-4 h-4 mr-2" />
                  )}
                  Generate Invite Link
                </Button>
              </div>

              {/* Show generated custom link if available */}
              {generatedLink && (
                <div className="p-3 bg-muted/60 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Generated Custom Invite Link ({linkRole})
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Max uses: {linkMaxUses} • Expires in {linkExpiryDays} days
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="customGeneratedLink"
                      readOnly
                      value={generatedLink}
                      className="bg-background text-sm font-mono"
                    />
                    <Button
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        copyToClipboard(generatedLink, setCopiedLink)
                      }
                    >
                      {copiedLink ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Default Workspace Invite Link */}
              <div className="pt-2">
                <Label htmlFor="defaultLink" className="text-xs text-muted-foreground">
                  Default Workspace Join Link
                </Label>
                <div className="flex py-1.5 gap-2">
                  <Input
                    id="defaultLink"
                    readOnly
                    value={defaultInviteUrl}
                    className="disabled:opacity-100 disabled:pointer-events-none text-sm font-mono"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="shrink-0"
                    onClick={() =>
                      copyToClipboard(defaultInviteUrl, setDefaultCopied)
                    }
                  >
                    {defaultCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ACTIVE INVITATIONS TAB */}
            <TabsContent value="active" className="space-y-3 mt-2">
              {isInvitationsLoading ? (
                <Loader className="w-6 h-6 animate-spin mx-auto my-6" />
              ) : invitations.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-lg text-sm text-muted-foreground">
                  No invitations generated yet. Send an email invite or create a link above.
                </div>
              ) : (
                <div className="space-y-2">
                  {invitations.map((inv: any) => {
                    const isExpired =
                      new Date(inv.expiresAt).getTime() < Date.now();
                    return (
                      <div
                        key={inv._id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-lg bg-card gap-2 text-sm"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                inv.method === "EMAIL" ? "default" : "secondary"
                              }
                              className="text-[11px]"
                            >
                              {inv.method === "EMAIL" ? "Email" : "Link"}
                            </Badge>
                            <span className="font-medium text-foreground">
                              {inv.email || "Shareable Link"}
                            </span>
                            <Badge variant="outline" className="text-[11px]">
                              {inv.role}
                            </Badge>
                            <Badge
                              variant={
                                inv.status === "ACCEPTED"
                                  ? "success"
                                  : inv.status === "REVOKED"
                                  ? "destructive"
                                  : isExpired
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-[11px]"
                            >
                              {isExpired && inv.status === "PENDING"
                                ? "EXPIRED"
                                : inv.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {inv.maxUses
                              ? `Used: ${inv.usedCount}/${inv.maxUses} • `
                              : `Used: ${inv.usedCount} times • `}
                            Expires:{" "}
                            {new Date(inv.expiresAt).toLocaleDateString()}
                          </span>
                        </div>

                        {inv.status === "PENDING" && !isExpired && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isRevoking}
                            onClick={() =>
                              revokeInvite({
                                workspaceId: workspace?._id!,
                                invitationId: inv._id,
                              })
                            }
                            className="shrink-0 text-xs h-8"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Revoke
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </PermissionsGuard>
    </div>
  );
};

export default InviteMember;
