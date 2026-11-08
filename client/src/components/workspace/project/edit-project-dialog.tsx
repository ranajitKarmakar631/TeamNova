import { Edit3 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import EditProjectForm from "./edit-project-form";
import { ProjectType } from "@/features/project";
import { useState } from "react";

interface EditProjectDialogProps {
  project?: ProjectType;
  isOpen?: boolean;
  onClose?: () => void;
  trigger?: React.ReactNode;
}

const EditProjectDialog = ({
  project,
  isOpen: controlledOpen,
  onClose: controlledOnClose,
  trigger,
}: EditProjectDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (val: boolean) => {
    if (isControlled) {
      if (!val && controlledOnClose) controlledOnClose();
    } else {
      setInternalOpen(val);
    }
  };

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  return (
    <div>
      <Dialog modal={true} open={open} onOpenChange={handleOpenChange}>
        {!isControlled && (
          <DialogTrigger className="mt-1.5" asChild>
            {trigger || (
              <button>
                <Edit3 className="w-5 h-5" />
              </button>
            )}
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-lg border-0">
          <EditProjectForm project={project} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditProjectDialog;
