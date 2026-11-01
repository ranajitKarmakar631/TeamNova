import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "../../ui/textarea";
import EmojiPickerComponent from "@/components/emoji-picker";
import { ProjectType } from "@/types/api.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { editProjectMutationFn, getAllTeamsQueryFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Loader, Users, X } from "lucide-react";

export default function EditProjectForm(props: {
  project?: ProjectType;
  onClose: () => void;
}) {
  const { project, onClose } = props;
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const [emoji, setEmoji] = useState("📊");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const projectId = project?._id as string;

  const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
    queryKey: ["allteams", workspaceId],
    queryFn: () => getAllTeamsQueryFn({ workspaceId, pageSize: 100 }),
    enabled: Boolean(workspaceId),
  });

  const teams = teamsData?.teams || [];

  const formSchema = z.object({
    name: z.string().trim().min(1, {
      message: "Project title is required",
    }),
    description: z.string().trim(),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: editProjectMutationFn,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (project) {
      setEmoji(project.emoji);
      form.setValue("name", project.name);
      form.setValue("description", project.description);

      const initialTeamIds: string[] = [];
      if (Array.isArray((project as any).teams)) {
        (project as any).teams.forEach((t: any) => {
          const id = t?._id || t;
          if (id && !initialTeamIds.includes(id.toString())) {
            initialTeamIds.push(id.toString());
          }
        });
      }
      const singleTeamId = (project.team as any)?._id || project.team;
      if (singleTeamId && !initialTeamIds.includes(singleTeamId.toString())) {
        initialTeamIds.push(singleTeamId.toString());
      }
      setSelectedTeamIds(initialTeamIds);
    }
  }, [form, project]);

  const handleEmojiSelection = (emoji: string) => {
    setEmoji(emoji);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;
    const payload = {
      projectId,
      workspaceId,
      data: {
        emoji,
        ...values,
        teamIds: selectedTeamIds,
      },
    };
    mutate(payload, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["singleProject", projectId],
        });

        queryClient.invalidateQueries({
          queryKey: ["project-overview", projectId],
        });

        queryClient.invalidateQueries({
          queryKey: ["project-teams", projectId],
        });

        queryClient.invalidateQueries({
          queryKey: ["allprojects", workspaceId],
        });

        toast({
          title: "Success",
          description: data.message,
          variant: "success",
        });

        setTimeout(() => onClose(), 100);
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
            Edit Project
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Update the project details to refine task management
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Select Emoji
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="font-normal size-[60px] !p-2 !shadow-none mt-2 items-center rounded-full "
                  >
                    <span className="text-4xl">{emoji}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className=" !p-0">
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
                      <Input placeholder="" className="!h-[48px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Assigned Teams Section */}
            <div className="mb-4 space-y-1.5">
              <FormLabel className="dark:text-[#f1f7feb5] text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                <span>Assigned Teams ({selectedTeamIds.length})</span>
                <span className="text-xs text-muted-foreground font-normal">
                  (Optional)
                </span>
              </FormLabel>

              <div className="space-y-2">
                {selectedTeamIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-muted/20">
                    {selectedTeamIds.map((id) => {
                      const team = teams.find((t) => t._id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          <Users className="w-3 h-3" />
                          <span>{team ? team.name : id}</span>
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
                          ? "No teams found"
                          : selectedTeamIds.length > 0
                          ? "Add another team..."
                          : "Select teams to assign to this project"
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
                        rows={4}
                        placeholder="Projects description"
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
              className="flex place-self-end  h-[40px] text-white font-semibold"
              type="submit"
            >
              {isPending && <Loader className="animate-spin" />}
              Update
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
