import { Separator } from "@/components/ui/separator";
import InviteMember from "@/components/workspace/member/invite-member";
import WorkspaceHeader from "@/components/workspace/common/workspace-header";

export default function SendInvite() {
  return (
    <div className="w-full h-auto pt-2 pb-12">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6">
        <WorkspaceHeader />
      </div>
      <Separator className="my-3" />
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-2">
        <InviteMember />
      </main>
    </div>
  );
}
