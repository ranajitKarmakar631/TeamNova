import React, { useState, useEffect } from "react";
import {
  Building2,
  ArrowLeft,
  Layers,
  X,
  Loader2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createWorkspaceMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

// UI Components from @/components/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import useAuth from "@/hooks/api/use-auth";

export interface AddWorkspaceFormData {
  name: string;
  slug: string;
  description: string;
  visibility: "private" | "public";
  inviteEmails: string;
}

export interface AddWorkspaceProps {
  onBack?: () => void;
  onClose?: () => void;
  onSubmit?: (data: AddWorkspaceFormData & { logo: File | null }) => void;
  isDialog?: boolean;
}

export default function AddWorkspace({
  onBack,
  onClose,
  onSubmit,
  isDialog = false,
}: AddWorkspaceProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: authData } = useAuth();
  const currentWorkspace = authData?.user?.currentWorkspace;
  const currentWorkspaceId =
    typeof currentWorkspace === "string"
      ? currentWorkspace
      : currentWorkspace?._id;
  const hasExistingWorkspace = Boolean(currentWorkspaceId);

  const [formData, setFormData] = useState<AddWorkspaceFormData>({
    name: "",
    slug: "",
    description: "",
    visibility: "private",
    inviteEmails: "",
  });


  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: createWorkspaceMutationFn,
    onSuccess: (data) => {
      queryClient.resetQueries({
        queryKey: ["userWorkspaces"],
      });
      queryClient.invalidateQueries({
        queryKey: ["authUser"],
      });

      toast({
        title: "Workspace created!",
        description: `"${data.workspace.name}" has been successfully created.`,
      });

      if (onSubmit) {
        onSubmit({ ...formData, logo });
      }

      if (onClose) {
        onClose();
      } else if (onBack) {
        onBack();
      }

      // Navigate to the newly created workspace
      navigate(`/workspace/${data.workspace._id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create workspace",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cleanup object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  // Auto-generate slug from workspace name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const generatedSlug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: generatedSlug,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogo(null);
    setLogoPreview(null);
  };

  const handleBackAction = () => {
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    } else if (currentWorkspaceId) {
      navigate(`/workspace/${currentWorkspaceId}`);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      toast({
        title: "Name is required",
        description: "Please enter a valid name for your workspace.",
        variant: "destructive",
      });
      return;
    }

    mutate({
      name: trimmedName,
      description: formData.description.trim(),
    });
  };

  const FormContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo Upload Section */}
      <div className="space-y-2">
        <Label>Workspace Logo</Label>
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-xl border-2 border-dashed border-input flex items-center justify-center bg-muted/50 overflow-hidden group hover:border-primary/50 transition-all">
            {logoPreview ? (
              <>
                <img
                  src={logoPreview}
                  alt="Workspace Logo"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white p-0.5 rounded-full shadow transition-all"
                  title="Remove logo"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <Building2 className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground">
              Upload an icon or logo
            </p>
            <p>PNG, JPG, or SVG up to 5MB.</p>
          </div>
        </div>
      </div>

      {/* Workspace Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Workspace Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleNameChange}
          placeholder="e.g. Acme Corp, Design Team"
        />
      </div>

      {/* Workspace Slug / URL */}
      <div className="space-y-2">
        <Label htmlFor="slug">Workspace URL / Slug</Label>
        <div className="flex rounded-md shadow-sm">
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-muted-foreground text-sm">
            tasknova.com/
          </span>
          <Input
            type="text"
            name="slug"
            id="slug"
            value={formData.slug}
            onChange={handleChange}
            placeholder="acme-corp"
            className="rounded-l-none"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Unique identifier for your workspace web link.
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description{" "}
          <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          placeholder="What is the primary goal of this workspace?"
          className="resize-none"
        />
      </div>

      {/* Visibility Toggle */}
      <div className="space-y-2">
        <Label>Workspace Visibility</Label>
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => setFormData((prev) => ({ ...prev, visibility: "private" }))}
            className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
              formData.visibility === "private"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card hover:bg-accent/50"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-foreground">
                Private
              </span>
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={formData.visibility === "private"}
                onChange={handleChange}
                className="text-primary focus:ring-primary"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Only invited members can view and join projects.
            </span>
          </div>

          <div
            onClick={() => setFormData((prev) => ({ ...prev, visibility: "public" }))}
            className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
              formData.visibility === "public"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card hover:bg-accent/50"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-foreground">
                Public
              </span>
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={formData.visibility === "public"}
                onChange={handleChange}
                className="text-primary focus:ring-primary"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Anyone within your organization can find and join.
            </span>
          </div>
        </div>
      </div>

      {/* Invite Members */}
      <div className="space-y-2">
        <Label htmlFor="inviteEmails">
          Invite Team Members{" "}
          <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
        </Label>
        <Input
          id="inviteEmails"
          name="inviteEmails"
          type="text"
          value={formData.inviteEmails}
          onChange={handleChange}
          placeholder="colleague@company.com, sarah@company.com"
        />
        <p className="text-xs text-muted-foreground">
          Separate multiple email addresses with commas.
        </p>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleBackAction}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || !formData.name.trim()}
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Creating...
            </>
          ) : (
            "Create Workspace"
          )}
        </Button>
      </div>
    </form>
  );

  // If used within a Modal/Dialog:
  if (isDialog) {
    return (
      <div className="p-6 sm:p-8 bg-card text-card-foreground">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Create a new workspace
              </h2>
              <p className="text-xs text-muted-foreground">
                Organize your team, projects, and tasks under one roof.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBackAction}
            className="h-8 w-8 rounded-lg"
            title="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        {FormContent}
      </div>
    );
  }

  // Standalone Full-Page Layout
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Top Header Navigation */}
      {hasExistingWorkspace && (
        <div className="absolute top-6 left-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackAction}
            className="gap-2 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <Layers className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-foreground">
          Create a new workspace
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Workspaces help you organize your team, projects, and tasks under one
          roof.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <Card className="shadow-lg border-border">
          <CardContent className="pt-6">
            {FormContent}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { AddWorkspace as CreateWorkspacePage };