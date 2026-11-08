import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreateTaskForm from "./create-task-form";
import { TaskStatusEnumType } from "@/constant";

interface CreateTaskDialogProps {
  projectId?: string;
  defaultStatus?: TaskStatusEnumType;
  trigger?: React.ReactNode;
}

const CreateTaskDialog = (props: CreateTaskDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <div>
      <Dialog modal={true} open={isOpen} onOpenChange={setIsOpen}>
        {props.trigger ? (
          <DialogTrigger asChild>{props.trigger}</DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <Button className="h-9 gap-1.5 font-medium shadow-sm">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-lg max-h-auto my-5 border-0">
          <CreateTaskForm
            projectId={props.projectId}
            defaultStatus={props.defaultStatus}
            onClose={onClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateTaskDialog;
