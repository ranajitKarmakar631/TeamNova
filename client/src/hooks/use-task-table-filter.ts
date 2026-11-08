import { parseAsString, useQueryStates } from "nuqs";

const useTaskTableFilter = () => {
  return useQueryStates({
    status: parseAsString,
    priority: parseAsString,
    keyword: parseAsString,
    projectId: parseAsString,
    assigneeId: parseAsString,
    teamId: parseAsString,
    view: parseAsString.withDefault("board"),
  });
};

export default useTaskTableFilter;
