import { parseAsString, useQueryStates } from "nuqs";

const projectFilterParsers = {
  keyword: parseAsString,
};

const useProjectTableFilter = () => {
  return useQueryStates(projectFilterParsers);
};

export default useProjectTableFilter;
