import AddWorkspace from "@/components/add-workspace";
import useCreateWorkspaceDialog from "@/hooks/use-create-workspace-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
const CreateWorkspaceDialog = () => {
  const { open, onClose } = useCreateWorkspaceDialog();
  return (
    <Dialog modal={true} open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-no-track !p-0 border-0 rounded-2xl">
        <AddWorkspace onClose={onClose} onBack={onClose} isDialog={true} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkspaceDialog;
