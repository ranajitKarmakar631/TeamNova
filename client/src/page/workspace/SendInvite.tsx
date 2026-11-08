import { Separator } from "@/components/ui/separator";
import InviteMember from "@/components/workspace/member/invite-member";
import WorkspaceHeader from "@/components/workspace/common/workspace-header";

export default function SendInvite() {
  return (
    <div className="w-full h-auto pt-2">
      <WorkspaceHeader />
      <Separator className="my-4 " />
      <main>
        <div className="w-full max-w-3xl mx-auto pt-3">
          <div>
            <h2 className="text-lg leading-[30px] font-semibold mb-1">
              Invite Members
            </h2>
            <p className="text-sm text-muted-foreground">
              Invite team members via email or direct invitation link with role assignments.
            </p>
          </div>
          <Separator className="my-4" />

          <InviteMember />
        </div>
      </main>
    </div>
  );
}
