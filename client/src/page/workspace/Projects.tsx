import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import useCreateProjectDialog from "@/hooks/use-create-project-dialog";
import ProjectsTable from "@/components/workspace/project/table/projects-table";
import { useAuthContext } from "@/context/auth-provider";
import { Permissions } from "@/constant";

export default function Projects() {
  const { onOpen } = useCreateProjectDialog();
  const { hasPermission } = useAuthContext()
  const canCreateProject = hasPermission(Permissions.PROJECT_CREATE);

  return (
    <div className="w-full h-full flex-col space-y-8 pt-3">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage your workspace projects, milestones, and deliverables!
          </p>
        </div>
        {canCreateProject && <Button onClick={onOpen} className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>}
      </div>
      <div>
        <ProjectsTable /> 
      </div>
    </div>
  );
}