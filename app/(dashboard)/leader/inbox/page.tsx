import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTeamMembers, getUnassignedTasks } from "@/lib/queries/leader";
import { prisma } from "@/lib/prisma";
import InboxTable from "./inbox-table";

export default async function LeaderInboxPage() {
  const session = await auth();
  const user = session?.user as any;
  const role = user?.role as string | undefined;
  if (!role || (role !== "LEADER" && role !== "ADMIN")) {
    redirect("/");
  }

  // Ensure we read teamId from DB (session may not include it)
  const me = user?.id
    ? await prisma.user.findUnique({ where: { id: user.id }, select: { teamId: true } })
    : null;
  const teamId = me?.teamId as string | undefined;
  if (!teamId) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
        Tài khoản của bạn chưa thuộc đội nào. Hãy liên hệ quản trị viên để được gán team.
      </div>
    );
  }

  const [tasks, members] = await Promise.all([
    getUnassignedTasks(teamId),
    getTeamMembers(teamId),
  ]);

  const unassignedCount = tasks.length;
  const teamSize = members.length;
  const avgWorkload = teamSize > 0
    ? Math.round((members.reduce((s, m) => s + (m._count?.tasksAssigned ?? 0), 0) / teamSize) * 10) / 10
    : 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded border bg-white p-4">
          <div className="text-sm text-gray-500">Unassigned</div>
          <div className="text-2xl font-semibold">{unassignedCount}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-sm text-gray-500">Team size</div>
          <div className="text-2xl font-semibold">{teamSize}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-sm text-gray-500">Avg workload</div>
          <div className="text-2xl font-semibold">{avgWorkload}</div>
        </div>
      </div>

      <div className="rounded border bg-white">
        <InboxTable tasks={tasks} members={members} />
      </div>
    </div>
  );
}


