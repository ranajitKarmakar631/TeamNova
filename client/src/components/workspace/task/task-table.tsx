import TaskView from "./task-view";

interface TaskTableProps {
  projectId?: string;
}

const TaskTable = ({ projectId }: TaskTableProps) => {
  return <TaskView projectId={projectId} />;
};

export default TaskTable;
export { TaskTable };
