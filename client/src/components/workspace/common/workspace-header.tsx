import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthContext } from "@/context/auth-provider";

const WorkspaceHeader = () => {
  const { workspaceLoading, workspace } = useAuthContext();
  const isInitialLoading = workspaceLoading && !workspace;

  return (
    <div className="w-full pb-2">
      {isInitialLoading ? (
        <div className="flex items-center gap-4 animate-pulse">
          <div className="size-[60px] rounded-lg bg-muted/60" />
          <div className="grid flex-1 gap-2 text-left">
            <div className="h-6 w-44 rounded bg-muted/60" />
            <div className="h-4 w-12 rounded bg-muted/40" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Avatar className="size-[60px] rounded-lg font-bold ">
            <AvatarFallback className="rounded-lg bg-gradient-to-tl text-[35px]  to-black from-black text-white">
              {workspace?.name?.split(" ")?.[0]?.charAt(0) || "W"}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-semibold text-xl">
              {workspace?.name}
            </span>
            <span className="truncate text-sm text-muted-foreground">Free</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceHeader;
