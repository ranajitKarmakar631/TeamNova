import { parseAsString, useQueryStates } from "nuqs";

const taskFilterParsers = {
  status: parseAsString,
  priority: parseAsString,
  keyword: parseAsString,
  projectId: parseAsString,
  assigneeId: parseAsString,
  teamId: parseAsString,
  view: parseAsString.withDefault("board"),
};

const useTaskTableFilter = () => {
  return useQueryStates(taskFilterParsers);
};

export default useTaskTableFilter;
