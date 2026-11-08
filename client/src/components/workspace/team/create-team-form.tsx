import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateTeamMutation } from "@/features/team";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import { TeamStatusEnum } from "@/constant";
import { useProjectsQuery } from "@/features/project";

const formSchema = z.object({
  name: z.string().trim().min(1, {
    message: "Team name is required",
  }).max(100, {
    message: "Team name must be 100 characters or less",
  }),
  projectId: z.string().trim().min(1, {
    message: "Project is required. Teams must be created under a project.",
  }),
  description: z.string().trim().max(500, {
    message: "Description must be 500 characters or less",
  }).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "INACTIVE"]).default("ACTIVE"),
});

export default function CreateTeamForm({
  projectId: propProjectId,
  onClose,
}: {
  projectId?: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { data: projectsData, isLoading: isLoadingProjects } = useProjectsQuery({
    workspaceId,
    skip: !!propProjectId,
  });
  const projects = projectsData?.projects || [];

  const { mutate, isPending } = useCreateTeamMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      projectId: propProjectId || "",
      description: "",
      status: "ACTIVE",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;

    mutate(
      {
        workspaceId,
        data: {
          name: values.name,
          projectId: values.projectId,
          description: values.description || undefined,
          status: values.status as keyof typeof TeamStatusEnum,
        },
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({
            queryKey: ["all-teams", workspaceId],
          });
          queryClient.invalidateQueries({
            queryKey: ["project-teams", values.projectId],
          });
          queryClient.invalidateQueries({
            queryKey: ["project-overview", values.projectId],
          });
          queryClient.invalidateQueries({
            queryKey: ["allprojects", workspaceId],
          });
          queryClient.invalidateQueries({
            queryKey: ["my-associations", workspaceId],
          });
          toast({
            title: "Success",
            description: data?.message || "Team created successfully",
            variant: "success",
          });
          onClose();
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error?.message || "Failed to create team",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Create New Team</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Teams are organized under a project to manage functional squads and assignments.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {!propProjectId && (
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select parent project"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          <div className="flex items-center gap-2">
                            <span>{p.emoji || "📁"}</span>
                            <span>{p.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Frontend Squad, Core API, Design" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Briefly describe the purpose or responsibilities of this team..."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader className="w-4 h-4 mr-2 animate-spin" />}
              Create Team
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
