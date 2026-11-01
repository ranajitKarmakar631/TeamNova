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
import { Textarea } from "../../ui/textarea";
import EmojiPickerComponent from "@/components/emoji-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProjectMutationFn, getAllTeamsQueryFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Loader, Plus, Users, X } from "lucide-react";

export default function CreateProjectForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const [emoji, setEmoji] = useState("📊");
  const [isCreatingNewTeam, setIsCreatingNewTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
    queryKey: ["allteams", workspaceId],
    queryFn: () => getAllTeamsQueryFn({ workspaceId }),
    staleTime: 1000 * 60 * 2,
  });

  const teams = teamsData?.teams || [];

  const { mutate, isPending } = useMutation({
    mutationFn: createProjectMutationFn,
  });

  const formSchema = z.object({
    name: z.string().trim().min(1, {
      message: "Project title is required",
    }),
    description: z.string().trim(),
    teamId: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      teamId: "",
    },
  });

  const handleEmojiSelection = (emoji: string) => {
    setEmoji(emoji);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;

    if (isCreatingNewTeam && !newTeamName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a name for the new team",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      workspaceId,
      data: {
        emoji,
        name: values.name,
        description: values.description,
        ...(isCreatingNewTeam && newTeamName.trim()
          ? { newTeam: { name: newTeamName.trim() } }
          : selectedTeamIds.length > 0
          ? { teamIds: selectedTeamIds, teamId: selectedTeamIds[0] }
          : values.teamId
          ? { teamId: values.teamId }
          : {}),
      },
    };

    mutate(payload, {
      onSuccess: (data) => {
        const project = data.project;
        queryClient.invalidateQueries({
          queryKey: ["allprojects", workspaceId],
        });
        queryClient.invalidateQueries({
          queryKey: ["allteams", workspaceId],
        });

        toast({
          title: "Success",
          description: "Project created successfully",
          variant: "success",
        });

        navigate(`/workspace/${workspaceId}/project/${project._id}`);
        setTimeout(() => onClose(), 500);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1
            className="text-xl tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1
           text-center sm:text-left"
          >
            Create Project
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Organize and manage tasks, resources, and team collaboration
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Emoji
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="font-normal size-[60px] !p-2 !shadow-none mt-2 items-center rounded-full"
                  >
                    <span className="text-4xl">{emoji}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="!p-0">
                  <EmojiPickerComponent onSelectEmoji={handleEmojiSelection} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="mb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Project title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Website Redesign"
                        className="!h-[48px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Team Association Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <FormLabel className="dark:text-[#f1f7feb5] text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Owning Team</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-primary hover:text-primary/80 px-2"
                  onClick={() => {
                    setIsCreatingNewTeam(!isCreatingNewTeam);
                    if (!isCreatingNewTeam) {
                      form.setValue("teamId", "");
                    }
                  }}
                >
                  {isCreatingNewTeam ? (
                    <span className="flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Pick existing team
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Create new team
                    </span>
                  )}
                </Button>
              </div>

              {isCreatingNewTeam ? (
                <div className="space-y-1.5">
                  <Input
                    placeholder="Enter new team name (e.g. Frontend Team)"
                    className="!h-[44px]"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This new team will be created in your workspace and assigned to this project.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedTeamIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-muted/20">
                      {selectedTeamIds.map((id) => {
                        const team = teams.find((t) => t._id === id);
                        if (!team) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                          >
                            <Users className="w-3 h-3" />
                            <span>{team.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedTeamIds((prev) =>
                                  prev.filter((tid) => tid !== id)
                                )
                              }
                              className="ml-0.5 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <Select
                    onValueChange={(val) => {
                      if (val && !selectedTeamIds.includes(val)) {
                        setSelectedTeamIds((prev) => [...prev, val]);
                        form.setValue("teamId", val);
                      }
                    }}
                    value=""
                  >
                    <SelectTrigger className="!h-[44px]">
                      <SelectValue
                        placeholder={
                          isLoadingTeams
                            ? "Loading teams..."
                            : teams.length === 0
                            ? "No teams found. Click 'Create new team'"
                            : selectedTeamIds.length > 0
                            ? "Add another team..."
                            : "Select team(s) to assign to this project"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {teams
                        .filter((t) => !selectedTeamIds.includes(t._id))
                        .map((t) => (
                          <SelectItem key={t._id} value={t._id}>
                            {t.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="mb-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Project description
                      <span className="text-xs font-extralight ml-2">
                        Optional
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Project description and objectives"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              disabled={isPending}
              className="flex place-self-end h-[40px] text-white font-semibold"
              type="submit"
            >
              {isPending && <Loader className="animate-spin mr-2" />}
              Create Project
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
