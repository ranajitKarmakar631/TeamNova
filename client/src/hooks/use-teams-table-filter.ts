import { TeamStatusEnum, TeamStatusEnumType } from "@/constant";
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

const useTeamTableFilter = () => {
  return useQueryStates({
    status: parseAsStringEnum<TeamStatusEnumType>(
      Object.values(TeamStatusEnum)
    ),
    keyword: parseAsString,
  });
};

export default useTeamTableFilter;
