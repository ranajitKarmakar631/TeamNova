import { TaskType } from "@/types/api.type";
import TaskDetailSheet from "./task-detail-sheet";

const EditTaskDialog = ({
  task,
  isOpen,
  onClose,
}: {
  task: TaskType;
  isOpen: boolean;
  onClose: () => void;
}) => {
  return <TaskDetailSheet task={task} isOpen={isOpen} onClose={onClose} />;
};

export default EditTaskDialog;
export { TaskDetailSheet };
