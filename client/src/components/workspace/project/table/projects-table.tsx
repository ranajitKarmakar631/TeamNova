import { FC, useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search, Backpack, UserCheck } from "lucide-react";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useDebounce from "@/hooks/use-debounce";
import useProjectTableFilter from "@/hooks/use-project-table-filter";
import { getProjectColumns } from "./project-columns";
import { DataTable } from "../../task/table/table";
import { useProjectsQuery, ProjectType } from "@/features/project";
import { useAuthContext } from "@/context/auth-provider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Filters = ReturnType<typeof useProjectTableFilter>[0];
type SetFilters = ReturnType<typeof useProjectTableFilter>[1];

interface DataTableFilterToolbarProps {
  isLoading?: boolean;
  filters: Filters;
  setFilters: SetFilters;
  viewFilter: "ALL" | "MY";
  setViewFilter: (val: "ALL" | "MY") => void;
  myProjectsCount: number;
}

const ProjectsTable = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewFilter, setViewFilter] = useState<"ALL" | "MY">("ALL");

  const [filters, setFilters] = useProjectTableFilter();
  const workspaceId = useWorkspaceId();
  const { associations } = useAuthContext();

  const columns = useMemo(
    () => getProjectColumns(workspaceId, associations),
    [workspaceId, associations]
  );

  const { data, isLoading } = useProjectsQuery({
    workspaceId,
    keyword: filters.keyword || undefined,
    onlyMyProjects: viewFilter === "MY",
    pageNumber,
    pageSize,
  });

  const projects: ProjectType[] = data?.projects || [];
  const totalCount = data?.pagination?.totalCount || 0;

  const associatedProjectIds = useMemo(() => {
    return new Set(
      associations
        .filter((a) => a.scopeType === "PROJECT" && a.status === "ACTIVE")
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
        data={projects}
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
            myProjectsCount={associatedProjectIds.size}
          />
        }
      />
    </div>
  );
};

const DataTableFilterToolbar: FC<DataTableFilterToolbarProps> = ({
  filters,
  setFilters,
  viewFilter,
  setViewFilter,
  myProjectsCount,
}) => {
  const [searchValue, setSearchValue] = useState(filters.keyword || "");
  const debouncedSearch = useDebounce(searchValue, 400);

  useEffect(() => {
    setSearchValue(filters.keyword || "");
  }, [filters.keyword]);

  useEffect(() => {
    setFilters((prev) => {
      const nextKeyword = debouncedSearch || null;
      if ((nextKeyword || null) !== (prev.keyword || null)) {
        return {
          ...prev,
          keyword: nextKeyword,
        };
      }
      return prev;
    });
  }, [debouncedSearch, setFilters]);

  const hasActiveFilters = Boolean(searchValue && searchValue !== "");

  return (
    <div className="flex flex-col sm:flex-row w-full items-start sm:items-center justify-between gap-3 mb-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-[260px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter projects by name..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-8 h-9 text-xs sm:text-sm"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchValue("");
              setFilters({ ...filters, keyword: null });
            }}
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Reset
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
            <Backpack className="w-3 h-3" />
            <span>All Projects</span>
          </TabsTrigger>
          <TabsTrigger value="MY" className="text-xs px-3 h-8 gap-1.5">
            <UserCheck className="w-3 h-3" />
            <span>My Projects</span>
            {myProjectsCount > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-semibold">
                {myProjectsCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default ProjectsTable;
