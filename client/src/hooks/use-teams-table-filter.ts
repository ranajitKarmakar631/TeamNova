import { TeamStatusEnum, TeamStatusEnumType } from "@/constant";
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

const teamFilterParsers = {
  status: parseAsStringEnum<TeamStatusEnumType>(
    Object.values(TeamStatusEnum)
  ),
  keyword: parseAsString,
};

const useTeamTableFilter = () => {
  return useQueryStates(teamFilterParsers);
};

export default useTeamTableFilter;
