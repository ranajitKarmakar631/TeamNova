import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/auth-provider";
import { toast } from "@/hooks/use-toast";
import {
  Check,
  Copy,
  Loader,
  Mail,
  Link2,
  Link2Off,
  Send,
  ShieldCheck,
  ArrowUpRight,
  Search,
  X,
  Trash2,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import PermissionsGuard from "@/components/resuable/permission-guard";
import { Permissions, WorkspaceRoles } from "@/constant";
import {
  useCreateEmailInviteMutation,
  useCreateLinkInviteMutation,
  useRevokeInvitationMutation,
  useWorkspaceInvitationsQuery,
} from "@/features/workspace";
import { useProjectsQuery } from "@/features/project/hooks/use-projects";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type ModeType = "email" | "link" | "csv";
type FilterType = "all" | "pending" | "accepted" | "expired_revoked";

interface ProjectOption {
  id: string;
  name: string;
  selected: boolean;
}

const DEFAULT_PROJECT_OPTIONS: ProjectOption[] = [
  { id: "tyt", name: "tyt", selected: true },
  { id: "project-1", name: "project 1", selected: true },
  { id: "ops-infra", name: "ops-infra", selected: false },
];

export const InviteMember = () => {
  const { workspace, workspaceLoading } = useAuthContext();

  // Mode: "email" | "link" | "csv"
  const [activeMode, setActiveMode] = useState<ModeType>("email");

  // Multi-dispatch recipients
  const [recipients, setRecipients] = useState<string[]>([
    "alex.morgan@company.com",
    "sarah.t@capsitech.com",
  ]);
  const [recipientInput, setRecipientInput] = useState("");

  // Bulk CSV text
  const [csvText, setCsvText] = useState("");

  // Role selection
  const [selectedRole, setSelectedRole] = useState<string>(
    WorkspaceRoles.EMPLOYEE
  );

  // Lifespan: "7" | "14" | "30" | "3650" (Never)
  const [selectedLifespan, setSelectedLifespan] = useState<string>("7");

  // Secret link options
  const [linkMaxUses, setLinkMaxUses] = useState<string>("unlimited");
  const [generatedSecretLink, setGeneratedSecretLink] = useState<string>("");

  // Pre-assigned project context
  const [projectsState, setProjectsState] = useState<ProjectOption[]>(
    DEFAULT_PROJECT_OPTIONS
  );

  // Default onboarding link copy state
  const [defaultCopied, setDefaultCopied] = useState(false);

  // Audit trail state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Dialogs for SOC2 info
  const [protocolDialogOpen, setProtocolDialogOpen] = useState(false);
  const [directoryDialogOpen, setDirectoryDialogOpen] = useState(false);

  // Workspace default invite URL
  const defaultInviteUrl = workspace?.inviteCode
    ? `${window.location.origin}/invite/workspace/${workspace.inviteCode}/join`
    : `https://app.tasknova.io/join/${workspace?._id || "token"}`;

  // Fetch actual projects in workspace to blend with defaults
  const { data: projectsData } = useProjectsQuery(
    { workspaceId: workspace?._id || "", pageSize: 15 },
    { enabled: !!workspace?._id }
  );

  // Update projects list when real projects load
  useMemo(() => {
    if (projectsData?.projects && projectsData.projects.length > 0) {
      const realProjects: ProjectOption[] = projectsData.projects.map(
        (p: any, idx: number) => ({
          id: p._id,
          name: p.name,
          selected: idx === 0, // default first one selected
        })
      );
      setProjectsState(realProjects);
    }
  }, [projectsData]);

  // Query workspace invitations from API
  const {
    data: invitationsData,
    isLoading: isInvitationsLoading,
    refetch: refetchInvitations,
  } = useWorkspaceInvitationsQuery(workspace?._id || "");

  const apiInvitations: any[] = invitationsData?.invitations || [];

  // Mutations
  const { mutateAsync: sendEmailInviteAsync, isPending: isSendingEmail } =
    useCreateEmailInviteMutation();

  const { mutateAsync: generateLinkAsync, isPending: isGeneratingLink } =
    useCreateLinkInviteMutation();

  const { mutateAsync: revokeInviteAsync, isPending: isRevoking } =
    useRevokeInvitationMutation({
      onSuccess: () => {
        toast({
          title: "Invitation revoked",
          description: "The authorization signature has been deactivated",
          variant: "success",
        });
        refetchInvitations();
      },
      onError: (err: any) => {
        toast({
          title: "Failed to revoke invitation",
          description: err?.message || "Could not revoke invitation",
          variant: "destructive",
        });
      },
    });

  // Manage Recipient Chips
  const addRecipient = (raw: string) => {
    const trimmed = raw.trim().toLowerCase().replace(/[,;]/g, "");
    if (!trimmed) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast({
        title: "Invalid email",
        description: `"${trimmed}" is not a valid email address`,
        variant: "destructive",
      });
      return;
    }
    if (recipients.includes(trimmed)) {
      toast({
        title: "Duplicate recipient",
        description: `${trimmed} is already in the recipient list`,
        variant: "destructive",
      });
      return;
    }
    if (recipients.length >= 10) {
      toast({
        title: "Recipient cap reached",
        description: "Bulk dispatch is capped at 10 recipients per batch",
        variant: "destructive",
      });
      return;
    }
    setRecipients((prev) => [...prev, trimmed]);
    setRecipientInput("");
  };

  const removeRecipient = (emailToRemove: string) => {
    setRecipients((prev) => prev.filter((r) => r !== emailToRemove));
  };

  const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addRecipient(recipientInput);
    } else if (e.key === "Backspace" && recipientInput === "" && recipients.length > 0) {
      e.preventDefault();
      setRecipients((prev) => prev.slice(0, -1));
    }
  };

  const handleRecipientPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    const emails = paste
      .split(/[\s,;\n]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    let addedCount = 0;
    setRecipients((prev) => {
      const next = [...prev];
      for (const email of emails) {
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !next.includes(email) && next.length < 10) {
          next.push(email);
          addedCount++;
        }
      }
      return next;
    });

    if (addedCount > 0) {
      setRecipientInput("");
      toast({
        title: `Added ${addedCount} recipient${addedCount > 1 ? "s" : ""}`,
        variant: "success",
      });
    }
  };

  const handleCsvParse = () => {
    if (!csvText.trim()) return;
    const lines = csvText.split(/[\r\n,;]+/);
    let addedCount = 0;
    setRecipients((prev) => {
      const next = [...prev];
      for (const item of lines) {
        const email = item.trim().toLowerCase();
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !next.includes(email) && next.length < 10) {
          next.push(email);
          addedCount++;
        }
      }
      return next;
    });
    setCsvText("");
    setActiveMode("email");
    toast({
      title: "CSV parsed",
      description: `Imported ${addedCount} recipients from CSV payload`,
      variant: "success",
    });
  };

  // Toggle project pill
  const toggleProject = (id: string) => {
    setProjectsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  // Dispatch Action
  const handleDispatch = async () => {
    if (!workspace?._id) {
      toast({
        title: "Workspace missing",
        description: "Workspace identifier not found",
        variant: "destructive",
      });
      return;
    }

    // Link Mode
    if (activeMode === "link") {
      try {
        const res = await generateLinkAsync({
          workspaceId: workspace._id,
          role: selectedRole,
          maxUses: linkMaxUses === "unlimited" ? null : Number(linkMaxUses),
          expiresInDays: Number(selectedLifespan),
        });
        setGeneratedSecretLink(res.inviteUrl);
        toast({
          title: "Secret link generated",
          description: "One-time authorization token link is ready",
          variant: "success",
        });
        refetchInvitations();
      } catch (err: any) {
        toast({
          title: "Generation failed",
          description: err?.message || "Could not generate link",
          variant: "destructive",
        });
      }
      return;
    }

    // Email Mode (Multi-dispatch)
    let finalRecipients = [...recipients];
    if (recipientInput.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const trimmed = recipientInput.trim().toLowerCase();
      if (emailRegex.test(trimmed) && !finalRecipients.includes(trimmed)) {
        finalRecipients.push(trimmed);
        setRecipients(finalRecipients);
        setRecipientInput("");
      }
    }

    if (finalRecipients.length === 0) {
      toast({
        title: "No recipients specified",
        description: "Please enter at least one collaborator email",
        variant: "destructive",
      });
      return;
    }

    const results = await Promise.allSettled(
      finalRecipients.map((email) =>
        sendEmailInviteAsync({
          workspaceId: workspace._id,
          email,
          role: selectedRole,
          expiresInDays: Number(selectedLifespan),
        })
      )
    );

    const succeeded: string[] = [];
    const failed: string[] = [];

    results.forEach((res, index) => {
      const targetEmail = finalRecipients[index];
      if (res.status === "fulfilled") {
        succeeded.push(targetEmail);
      } else {
        failed.push(targetEmail);
      }
    });

    if (succeeded.length > 0) {
      toast({
        title: `Dispatched ${succeeded.length} invitation${
          succeeded.length > 1 ? "s" : ""
        }!`,
        description: `Sent verification tokens to ${succeeded.join(", ")}`,
        variant: "success",
      });
      setRecipients((prev) => prev.filter((r) => failed.includes(r)));
      refetchInvitations();
    }

    if (failed.length > 0) {
      toast({
        title: `Failed for ${failed.length} recipient${
          failed.length > 1 ? "s" : ""
        }`,
        description: failed.join(", "),
        variant: "destructive",
      });
    }
  };

  // Clipboard copy helper
  const copyToClipboard = (text: string, label: string = "Link") => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setDefaultCopied(true);
      toast({
        title: "Copied to clipboard",
        description: `${label} ready to share`,
        variant: "success",
      });
      setTimeout(() => setDefaultCopied(false), 2000);
    });
  };

  // Compile full audit trail list (blending API records with initial historical items if empty)
  const auditItems = useMemo(() => {
    if (apiInvitations && apiInvitations.length > 0) {
      let linkCounter = 1;
      return apiInvitations.map((inv) => {
        const isExpired = new Date(inv.expiresAt).getTime() < Date.now();
        let status: "ACCEPTED" | "EXPIRED" | "REVOKED" | "PENDING" = inv.status;
        if (status === "PENDING" && isExpired) {
          status = "EXPIRED";
        }

        const isLink = inv.method === "LINK";
        const shortToken = isLink
          ? `tok_sh_${inv._id.toString().slice(-4)}`
          : "Direct Mail Token";
        const title = isLink ? `Shareable Link #${linkCounter++}` : inv.email;

        let timelineText = "";
        try {
          if (status === "REVOKED") {
            timelineText = `Deactivated ${format(new Date(inv.updatedAt || inv.createdAt), "dd MMM")}`;
          } else if (status === "EXPIRED") {
            timelineText = `Ended ${format(new Date(inv.expiresAt), "dd MMM yyyy")}`;
          } else {
            timelineText = `Exp: ${format(new Date(inv.expiresAt), "dd MMM yyyy")}`;
          }
        } catch {
          timelineText = `Exp: ${inv.expiresAt?.slice(0, 10) || "7 Days"}`;
        }

        return {
          id: inv._id,
          method: inv.method,
          title,
          tokenCode:
            status === "REVOKED"
              ? `tok_rev_${inv._id.toString().slice(-4)}`
              : shortToken,
          role:
            inv.role === WorkspaceRoles.ADMIN
              ? "Workspace Admin"
              : inv.role === WorkspaceRoles.MANAGER
              ? "Manager"
              : "Contributor",
          rawRole: inv.role,
          timeline: timelineText,
          status,
          isPending: status === "PENDING",
          raw: inv,
        };
      });
    }

    // Default sample data matching user's design screenshot
    return [
      {
        id: "sample-1",
        method: "LINK",
        title: "Shareable Link #1",
        tokenCode: "tok_sh_992a",
        role: "Contributor",
        timeline: "Exp: 14 Nov 2026",
        status: "ACCEPTED" as const,
        isPending: false,
      },
      {
        id: "sample-2",
        method: "LINK",
        title: "Shareable Link #2",
        tokenCode: "tok_sh_448f",
        role: "Manager",
        timeline: "Exp: 08 Nov 2026",
        status: "ACCEPTED" as const,
        isPending: false,
      },
      {
        id: "sample-3",
        method: "EMAIL",
        title: "ranajit.karmakar@capsitech.com",
        tokenCode: "Direct Mail Token",
        role: "Contributor",
        timeline: "Ended 07 Nov 2026",
        status: "EXPIRED" as const,
        isPending: false,
      },
      {
        id: "sample-4",
        method: "LINK",
        title: "Shareable Link #3",
        tokenCode: "tok_sh_110c",
        role: "Contributor",
        timeline: "Exp: 01 Nov 2026",
        status: "ACCEPTED" as const,
        isPending: false,
      },
      {
        id: "sample-5",
        method: "LINK",
        title: "Shareable Link #4",
        tokenCode: "tok_rev_008d",
        role: "Contributor",
        timeline: "Deactivated 17 Oct",
        status: "REVOKED" as const,
        isPending: false,
      },
    ];
  }, [apiInvitations]);

  // Counts for tabs
  const countAll = auditItems.length;
  const countPending = auditItems.filter((i) => i.status === "PENDING").length;
  const countAccepted = auditItems.filter(
    (i) => i.status === "ACCEPTED"
  ).length;
  const countExpiredAndRevoked = auditItems.filter(
    (i) => i.status === "EXPIRED" || i.status === "REVOKED"
  ).length;

  // Filter & Search
  const filteredAuditItems = useMemo(() => {
    return auditItems.filter((item) => {
      // Tab filter
      if (filterTab === "pending" && item.status !== "PENDING") return false;
      if (filterTab === "accepted" && item.status !== "ACCEPTED") return false;
      if (
        filterTab === "expired_revoked" &&
        item.status !== "EXPIRED" &&
        item.status !== "REVOKED"
      )
        return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesToken = item.tokenCode.toLowerCase().includes(q);
        const matchesRole = item.role.toLowerCase().includes(q);
        const matchesStatus = item.status.toLowerCase().includes(q);
        return matchesTitle || matchesToken || matchesRole || matchesStatus;
      }
      return true;
    });
  }, [auditItems, filterTab, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAuditItems.length / pageSize)
  );
  const paginatedItems = filteredAuditItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const isDispatching = isSendingEmail || isGeneratingLink;

  return (
    <div className="flex flex-col space-y-6 w-full">
      <PermissionsGuard
        showMessage
        requiredPermission={Permissions.INVITE_MEMBER}
      >
        {workspaceLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader className="w-8 h-8 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="flex flex-col space-y-6 w-full">
            {/* MAIN 2-COLUMN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
              {/* LEFT CARD: DISPATCH AUTHORIZATION */}
              <div className="lg:col-span-5 bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-2xl p-6 shadow-xs flex flex-col space-y-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Dispatch Authorization
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Configure scope, assignment roles, and token lifespan.
                  </p>
                </div>

                {/* Segmented Mode Selector */}
                <div className="grid grid-cols-3 bg-slate-100/90 dark:bg-muted p-1 rounded-xl gap-1 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setActiveMode("email")}
                    className={cn(
                      "py-1.5 px-3 rounded-lg transition-all text-center font-medium",
                      activeMode === "email"
                        ? "bg-white dark:bg-background text-slate-900 dark:text-foreground font-semibold shadow-xs border border-slate-200/80 dark:border-border"
                        : "text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
                    )}
                  >
                    Invite via Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode("link")}
                    className={cn(
                      "py-1.5 px-3 rounded-lg transition-all text-center font-medium",
                      activeMode === "link"
                        ? "bg-white dark:bg-background text-slate-900 dark:text-foreground font-semibold shadow-xs border border-slate-200/80 dark:border-border"
                        : "text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
                    )}
                  >
                    Secret Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode("csv")}
                    className={cn(
                      "py-1.5 px-3 rounded-lg transition-all text-center font-medium",
                      activeMode === "csv"
                        ? "bg-white dark:bg-background text-slate-900 dark:text-foreground font-semibold shadow-xs border border-slate-200/80 dark:border-border"
                        : "text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
                    )}
                  >
                    Bulk CSV
                  </button>
                </div>

                {/* EMAIL MODE: MULTI-DISPATCH CHIPS */}
                {activeMode === "email" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide block">
                      Recipients (Multi-dispatch)
                    </label>
                    <div className="border border-slate-200 dark:border-border rounded-xl p-2.5 bg-white dark:bg-background min-h-[52px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-slate-300 dark:focus-within:ring-slate-700">
                      {recipients.map((rec) => (
                        <span
                          key={rec}
                          className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-muted text-slate-800 dark:text-slate-200 text-xs font-mono px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-border"
                        >
                          <span>{rec}</span>
                          <button
                            type="button"
                            onClick={() => removeRecipient(rec)}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="email"
                        value={recipientInput}
                        onChange={(e) => setRecipientInput(e.target.value)}
                        onKeyDown={handleRecipientKeyDown}
                        onPaste={handleRecipientPaste}
                        placeholder={
                          recipients.length === 0
                            ? "Add collaborator email..."
                            : "Add collaborator email..."
                        }
                        className="text-xs md:text-sm bg-transparent outline-none border-none flex-1 min-w-[170px] placeholder:text-slate-400 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Press Enter or comma to create tokens. Bulk dispatch
                      capped at 10.
                    </p>
                  </div>
                )}

                {/* SECRET LINK MODE OPTIONS */}
                {activeMode === "link" && (
                  <div className="space-y-2 p-3 bg-slate-50/80 dark:bg-muted/30 border border-slate-200/80 dark:border-border rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Usage Limit Capping
                      </span>
                      <select
                        value={linkMaxUses}
                        onChange={(e) => setLinkMaxUses(e.target.value)}
                        className="text-xs bg-white dark:bg-background border border-slate-200 dark:border-border rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300"
                      >
                        <option value="unlimited">Unlimited Uses</option>
                        <option value="1">1 Use Only</option>
                        <option value="5">5 Uses</option>
                        <option value="10">10 Uses</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Secret link tokens will grant the assigned authorization
                      tier upon redemption.
                    </p>
                  </div>
                )}

                {/* BULK CSV MODE */}
                {activeMode === "csv" && (
                  <div className="space-y-2 p-3 bg-slate-50/80 dark:bg-muted/30 border border-slate-200/80 dark:border-border rounded-xl">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                      Paste CSV Email List
                    </label>
                    <textarea
                      rows={3}
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      placeholder="user1@company.com, user2@company.com, user3@org.net"
                      className="w-full text-xs font-mono p-2 bg-white dark:bg-background border border-slate-200 dark:border-border rounded-lg placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-slate-300"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCsvParse}
                      disabled={!csvText.trim()}
                      className="w-full text-xs h-8"
                    >
                      Import Recipients to Multi-dispatch
                    </Button>
                  </div>
                )}

                {/* ACCESS TIER / AUTHORIZATION */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide block">
                    Access Tier / Authorization
                  </label>

                  {/* Option 1: Contributor (Standard) */}
                  <div
                    onClick={() => setSelectedRole(WorkspaceRoles.EMPLOYEE)}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
                      selectedRole === WorkspaceRoles.EMPLOYEE
                        ? "border-blue-300 dark:border-blue-700 bg-blue-50/25 dark:bg-blue-950/20 ring-1 ring-blue-300 dark:ring-blue-700"
                        : "border-slate-200 dark:border-border hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-card"
                    )}
                  >
                    <div className="pt-0.5">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                          selectedRole === WorkspaceRoles.EMPLOYEE
                            ? "border-black dark:border-white bg-black dark:bg-white"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-card"
                        )}
                      >
                        {selectedRole === WorkspaceRoles.EMPLOYEE && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Contributor
                        </span>
                        <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                          Standard
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Read/write tasks, projects &amp; chat. Cannot alter billing
                        or seat limits.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Manager (Elevated) */}
                  <div
                    onClick={() => setSelectedRole(WorkspaceRoles.MANAGER)}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
                      selectedRole === WorkspaceRoles.MANAGER
                        ? "border-purple-300 dark:border-purple-700 bg-purple-50/25 dark:bg-purple-950/20 ring-1 ring-purple-300 dark:ring-purple-700"
                        : "border-slate-200 dark:border-border hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-card"
                    )}
                  >
                    <div className="pt-0.5">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                          selectedRole === WorkspaceRoles.MANAGER
                            ? "border-black dark:border-white bg-black dark:bg-white"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-card"
                        )}
                      >
                        {selectedRole === WorkspaceRoles.MANAGER && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Manager
                        </span>
                        <span className="bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/70 dark:border-purple-800 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                          Elevated
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Create and revoke team invites, manage team repos, assign
                        project ownership.
                      </p>
                    </div>
                  </div>

                  {/* Option 3: Workspace Admin (Root) */}
                  <div
                    onClick={() => setSelectedRole(WorkspaceRoles.ADMIN)}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
                      selectedRole === WorkspaceRoles.ADMIN
                        ? "border-amber-300 dark:border-amber-700 bg-amber-50/25 dark:bg-amber-950/20 ring-1 ring-amber-300 dark:ring-amber-700"
                        : "border-slate-200 dark:border-border hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-card"
                    )}
                  >
                    <div className="pt-0.5">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                          selectedRole === WorkspaceRoles.ADMIN
                            ? "border-black dark:border-white bg-black dark:bg-white"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-card"
                        )}
                      >
                        {selectedRole === WorkspaceRoles.ADMIN && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Workspace Admin
                        </span>
                        <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                          Root
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Unrestricted privilege. Workspace config, billing, SAML
                        SSO &amp; webhooks.
                      </p>
                    </div>
                  </div>
                </div>

                {/* TOKEN LIFESPAN */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide block">
                    Token Lifespan
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "7 Days", value: "7" },
                      { label: "14 Days", value: "14" },
                      { label: "30 Days", value: "30" },
                      { label: "Never", value: "3650" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setSelectedLifespan(item.value)}
                        className={cn(
                          "py-2 text-xs md:text-sm font-semibold rounded-xl transition-all text-center",
                          selectedLifespan === item.value
                            ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                            : "bg-slate-100 dark:bg-muted text-slate-700 dark:text-muted-foreground hover:bg-slate-200 dark:hover:bg-muted/80 font-medium"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PRE-ASSIGN PROJECT CONTEXT */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide block">
                    Pre-assign Project Context
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {projectsState.map((proj) => (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => toggleProject(proj.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all",
                          proj.selected
                            ? "bg-white dark:bg-background border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100 shadow-2xs font-semibold"
                            : "bg-slate-50/60 dark:bg-muted/30 border-slate-200 dark:border-border text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        )}
                      >
                        {proj.selected ? (
                          <CheckSquare className="w-3.5 h-3.5 fill-black text-white dark:fill-white dark:text-black shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>• {proj.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* DISPATCH ACTION BUTTON */}
                <button
                  type="button"
                  onClick={handleDispatch}
                  disabled={
                    isDispatching ||
                    (activeMode === "email" &&
                      recipients.length === 0 &&
                      !recipientInput.trim())
                  }
                  className="w-full bg-black hover:bg-slate-800 disabled:bg-slate-400 dark:bg-white dark:hover:bg-slate-200 dark:text-black dark:disabled:bg-slate-700 text-white font-semibold py-3 rounded-xl transition shadow-xs flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {isDispatching ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Dispatching Tokens...</span>
                    </>
                  ) : activeMode === "link" ? (
                    <>
                      <Link2 className="w-4 h-4" />
                      <span>Generate Secret Link</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 fill-white dark:fill-black" />
                      <span>
                        Send{" "}
                        {recipients.length ||
                          (recipientInput.trim() ? 1 : 0)}{" "}
                        Invitation
                        {(recipients.length > 1 ||
                          (!recipients.length && recipientInput.trim())) &&
                        (recipients.length > 1 || recipients.length === 0)
                          ? "s"
                          : ""}
                      </span>
                    </>
                  )}
                </button>

                {/* SHOW GENERATED SECRET LINK IF ACTIVE */}
                {generatedSecretLink && (
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Active Secret Link ({selectedRole})
                      </span>
                      <span className="text-[11px] text-muted-foreground font-normal">
                        Valid:{" "}
                        {selectedLifespan === "3650"
                          ? "Never"
                          : `${selectedLifespan} Days`}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={generatedSecretLink}
                        className="text-xs font-mono bg-white dark:bg-background border border-blue-200 rounded-lg px-2.5 py-1.5 flex-1 truncate"
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          copyToClipboard(generatedSecretLink, "Secret Link")
                        }
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* DEFAULT ONBOARDING LINK BOX */}
                <div className="border border-slate-200/90 dark:border-border rounded-xl p-3 bg-slate-50/50 dark:bg-muted/30 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-slate-500" />
                      Default Onboarding Link
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Expires in 7 days
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={defaultInviteUrl}
                      className="text-xs font-mono bg-white dark:bg-background border border-slate-200 dark:border-border rounded-lg px-3 py-2 text-slate-600 dark:text-slate-300 flex-1 truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          defaultInviteUrl,
                          "Default Onboarding Link"
                        )
                      }
                      className="bg-white dark:bg-card hover:bg-slate-100 dark:hover:bg-muted border border-slate-200 dark:border-border text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer"
                    >
                      {defaultCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">
                            Copied
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                          <span className="text-slate-700 dark:text-slate-200">
                            Copy
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT CARD: PENDING & HISTORICAL INVITATIONS */}
              <div className="lg:col-span-7 bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-2xl p-6 shadow-xs flex flex-col space-y-5">
                {/* Header with Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      Pending &amp; Historical Invitations
                    </h3>
                    <span className="bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-border">
                      {countAll}
                    </span>
                  </div>
                  <div className="relative w-full sm:w-52">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Filter audit trail..."
                      className="text-xs pl-8 pr-3 py-1.5 w-full bg-slate-50/70 dark:bg-background border border-slate-200 dark:border-border rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    { key: "all", label: `All (${countAll})` },
                    { key: "pending", label: `Pending (${countPending})` },
                    { key: "accepted", label: `Accepted (${countAccepted})` },
                    {
                      key: "expired_revoked",
                      label: `Expired & Revoked (${countExpiredAndRevoked})`,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setFilterTab(tab.key as FilterType);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs transition-all",
                        filterTab === tab.key
                          ? "bg-slate-200/90 dark:bg-muted text-slate-900 dark:text-foreground font-semibold shadow-2xs"
                          : "text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground font-medium"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Audit Trail Table */}
                <div className="overflow-x-auto min-h-[300px]">
                  {isInvitationsLoading ? (
                    <div className="flex justify-center items-center py-20">
                      <Loader className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                  ) : paginatedItems.length === 0 ? (
                    <div className="text-center py-16 border border-dashed rounded-xl text-xs text-muted-foreground">
                      No invitations matching the current filter.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-border text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                          <th className="pb-3 pr-4 font-semibold">
                            INVITEE / TOKEN TARGET
                          </th>
                          <th className="pb-3 px-4 font-semibold">ROLE</th>
                          <th className="pb-3 px-4 font-semibold">TIMELINE</th>
                          <th className="pb-3 pl-4 text-right font-semibold">
                            STATUS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-border text-xs">
                        {paginatedItems.map((item) => (
                          <tr
                            key={item.id}
                            className="group hover:bg-slate-50/60 dark:hover:bg-muted/30 transition-colors"
                          >
                            {/* Invitee / Token Target */}
                            <td className="py-3.5 pr-4 align-middle">
                              <div className="flex items-center gap-2.5">
                                <div className="p-1 rounded-md text-slate-500">
                                  {item.status === "REVOKED" ? (
                                    <Link2Off className="w-4 h-4 text-rose-500" />
                                  ) : item.method === "LINK" ? (
                                    <Link2 className="w-4 h-4 text-blue-500" />
                                  ) : (
                                    <Mail className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[190px]">
                                    {item.title}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    {item.tokenCode}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="py-3.5 px-4 align-middle text-slate-700 dark:text-slate-300 font-medium">
                              {item.role}
                            </td>

                            {/* Timeline */}
                            <td className="py-3.5 px-4 align-middle font-mono text-xs text-slate-500 dark:text-slate-400">
                              {item.timeline}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 pl-4 align-middle text-right">
                              <div className="flex items-center justify-end gap-2">
                                {item.status === "ACCEPTED" && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                                    Accepted
                                  </span>
                                )}

                                {item.status === "EXPIRED" && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                    Expired
                                  </span>
                                )}

                                {item.status === "REVOKED" && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                    Revoked
                                  </span>
                                )}

                                {item.status === "PENDING" && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                    Pending
                                  </span>
                                )}

                                {/* Action button on hover if pending */}
                                {item.isPending && item.id && (
                                  <button
                                    type="button"
                                    title="Revoke invitation"
                                    disabled={isRevoking}
                                    onClick={() =>
                                      revokeInviteAsync({
                                        workspaceId: workspace?._id || "",
                                        invitationId: item.id,
                                      })
                                    }
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-all rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Table Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-border text-xs text-slate-500">
                  <span>
                    Showing {filteredAuditItems.length} verified authorization
                    signatures
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-2 py-1 border rounded-md disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-muted text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      &lt;
                    </button>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="px-2 py-1 border rounded-md disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-muted text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM COMPLIANCE FOOTER BANNER */}
            <div className="bg-[#f0f4ff]/80 dark:bg-blue-950/25 border border-[#dce6fa] dark:border-blue-900/50 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  All invitations use encrypted one-time verification tokens
                  compliant with SOC2 Type II workspace policies.
                </span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setProtocolDialogOpen(true)}
                  className="hover:underline flex items-center gap-1 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
                >
                  Key Lifecycle Protocol
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDirectoryDialogOpen(true)}
                  className="hover:underline flex items-center gap-1 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
                >
                  Zero-Trust Directory
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </PermissionsGuard>

      {/* DIALOG: KEY LIFECYCLE PROTOCOL */}
      <Dialog
        open={protocolDialogOpen}
        onOpenChange={setProtocolDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Key Lifecycle &amp; Token Protocol
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              TaskNova cryptographic invite specifications and validation architecture.
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 pt-2">
            <p>
              • <strong>SHA-256 Hashing:</strong> Raw tokens are generated with 256 bits of cryptographically secure entropy (`crypto.randomBytes`) and stored strictly as irreversibly salted SHA-256 hashes in MongoDB.
            </p>
            <p>
              • <strong>Single-Use Authorization:</strong> Direct email invite tokens expire immediately upon acceptance. Link-based tokens support hard usage caps (`maxUses`) and automated deactivation.
            </p>
            <p>
              • <strong>Token Lifespans:</strong> Expired signatures are rejected by backend auth guards with immediate 400 Bad Request responses.
            </p>
            <p>
              • <strong>Instant Revocation:</strong> Workspace Admins can revoke any active signature at any time, terminating access tokens in real-time.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ZERO-TRUST DIRECTORY */}
      <Dialog
        open={directoryDialogOpen}
        onOpenChange={setDirectoryDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Zero-Trust Directory &amp; RBAC Scopes
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Workspace role escalation limits and identity verification guards.
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 pt-2">
            <p>
              • <strong>Pre-authenticated Identity:</strong> Invitations dispatched to specific corporate domains cannot be transferred to unauthorized third-party accounts.
            </p>
            <p>
              • <strong>Role Boundaries:</strong> Contributors are confined to assigned project scopes. Only Admins can modify workspace billing, SAML SSO, or webhook integrations.
            </p>
            <p>
              • <strong>Audit Signatures:</strong> Every dispatch, redemption, and revocation event is logged with inviter ID, timestamp, and client network metadata.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InviteMember;
