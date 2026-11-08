import { FC, useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search, Shield, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useDebounce from "@/hooks/use-debounce";
import { TeamType } from "@/types/api.type";
import useTeamTableFilter from "@/hooks/use-teams-table-filter";
import { getTeamColumns } from "./team-columns";
import { DataTable } from "./table";
import { DataTableFacetedFilter } from "./table-faceted-filter";
import { teamStatuses } from "./team-data";
import { getAllTeamsQueryFn } from "@/lib/api";
import { useAuthContext } from "@/context/auth-provider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Filters = ReturnType<typeof useTeamTableFilter>[0];
type SetFilters = ReturnType<typeof useTeamTableFilter>[1];

interface DataTableFilterToolbarProps {
  isLoading?: boolean;
  filters: Filters;
  setFilters: SetFilters;
  viewFilter: "ALL" | "MY";
  setViewFilter: (val: "ALL" | "MY") => void;
  myTeamsCount: number;
}

const TeamsTable = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewFilter, setViewFilter] = useState<"ALL" | "MY">("ALL");

  const [filters, setFilters] = useTeamTableFilter();
  const workspaceId = useWorkspaceId();
  const { associations } = useAuthContext();

  const columns = useMemo(
    () => getTeamColumns(workspaceId, associations),
    [workspaceId, associations]
  );

  const { data, isLoading } = useQuery({
    queryKey: [
      "all-teams",
      workspaceId,
      pageSize,
      pageNumber,
      filters.keyword,
      filters.status,
      viewFilter,
    ],
    queryFn: () =>
      getAllTeamsQueryFn({
        workspaceId,
        keyword: filters.keyword,
        status: filters.status,
        onlyMyTeams: viewFilter === "MY",
        pageNumber,
        pageSize,
      }),
    staleTime: 0,
    enabled: !!workspaceId,
  });

  const teams: TeamType[] = data?.teams || [];
  const totalCount = data?.pagination?.totalCount || 0;

  const associatedTeamIds = useMemo(() => {
    return new Set(
      associations
        .filter((a) => a.scopeType === "TEAM" && a.status === "ACTIVE")
        .map((a) => a.scopeId)
    );
  }, [associations]);

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
  };

  return (
    <div className="w-full relative space-y-4">
      <DataTable
        isLoading={isLoading}
        data={teams}
        columns={columns}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pagination={{
          totalCount,
          pageNumber,
          pageSize,
        }}
        filtersToolbar={
          <DataTableFilterToolbar
            isLoading={isLoading}
            filters={filters}
            setFilters={setFilters}
            viewFilter={viewFilter}
            setViewFilter={setViewFilter}
            myTeamsCount={associatedTeamIds.size}
          />
        }
      />
    </div>
  );
};

const DataTableFilterToolbar: FC<DataTableFilterToolbarProps> = ({
  isLoading,
  filters,
  setFilters,
  viewFilter,
  setViewFilter,
  myTeamsCount,
}) => {
  const [searchValue, setSearchValue] = useState(filters.keyword || "");
  const debouncedSearch = useDebounce(searchValue, 400);

  useEffect(() => {
    setSearchValue(filters.keyword || "");
  }, [filters.keyword]);

  useEffect(() => {
    if ((debouncedSearch || null) !== (filters.keyword || null)) {
      setFilters({
        ...filters,
        keyword: debouncedSearch || null,
      });
    }
  }, [debouncedSearch]);

  const handleFilterChange = (key: keyof Filters, values: string[]) => {
    setFilters({
      ...filters,
      [key]: values.length > 0 ? values.join(",") : null,
    });
  };

  const hasActiveFilters = Boolean(
    searchValue || filters.status
  );

  return (
    <div className="flex flex-col sm:flex-row w-full items-start sm:items-center justify-between gap-3 mb-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto flex-wrap">
        <div className="relative w-full sm:w-[250px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter teams by name..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-9 pl-8 w-full text-xs sm:text-sm"
          />
        </div>

        {/* Status filter */}
        <DataTableFacetedFilter
          title="Status"
          multiSelect={true}
          options={teamStatuses}
          disabled={isLoading}
          selectedValues={filters.status?.split(",") || []}
          onFilterChange={(values) => handleFilterChange("status", values)}
        />

        {hasActiveFilters && (
          <Button
            disabled={isLoading}
            variant="ghost"
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearchValue("");
              setFilters({
                keyword: null,
                status: null,
              });
            }}
          >
            Reset
            <X className="ml-1 h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <Tabs
        value={viewFilter}
        onValueChange={(val) => setViewFilter(val as "ALL" | "MY")}
        className="w-full sm:w-auto"
      >
        <TabsList className="h-9 bg-muted/60 p-0.5">
          <TabsTrigger value="ALL" className="text-xs px-3 h-8 gap-1.5">
            <Shield className="w-3 h-3" />
            <span>All Teams</span>
          </TabsTrigger>
          <TabsTrigger value="MY" className="text-xs px-3 h-8 gap-1.5">
            <UserCheck className="w-3 h-3" />
            <span>My Teams</span>
            {myTeamsCount > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-semibold">
                {myTeamsCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default TeamsTable;
