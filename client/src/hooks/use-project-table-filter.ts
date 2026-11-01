import { parseAsString, useQueryStates } from "nuqs";

const useProjectTableFilter = () => {
  return useQueryStates({
    keyword: parseAsString,
  });
};

export default useProjectTableFilter;
