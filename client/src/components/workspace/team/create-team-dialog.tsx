import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreateTeamForm from "./create-team-form";

interface CreateTeamDialogProps {
  projectId?: string;
  triggerButton?: React.ReactNode;
}

const CreateTeamDialog = ({ projectId, triggerButton }: CreateTeamDialogProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <div>
      <Dialog modal={true} open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {triggerButton || (
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span>New Team</span>
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-auto my-5 border">
          <CreateTeamForm projectId={projectId} onClose={onClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateTeamDialog;
