import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTeamWorkload } from "@/lib/queries/leader";
import Link from "next/link";

export default async function LeaderTeamPage() {
  const session = await auth();
  const user = session?.user as any;
  const role = user?.role as string | undefined;
  if (!role || (role !== "LEADER" && role !== "ADMIN")) redirect("/");

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

  const items = await getTeamWorkload(teamId);

  const STATUSES: { key: keyof typeof items[number]["counts"]; label: string; status?: string }[] = [
    { key: "todo", label: "TODO", status: "TODO" },
    { key: "inProgress", label: "IN_PROGRESS", status: "IN_PROGRESS" },
    { key: "inReview", label: "IN_REVIEW", status: "IN_REVIEW" },
    { key: "blocked", label: "BLOCKED", status: "BLOCKED" },
    { key: "rework", label: "REWORK", status: "REWORK" },
    { key: "done", label: "DONE", status: "DONE" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Team Workload</h1>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Member</th>
              {STATUSES.map((s) => (
                <th key={s.key as string} className="px-3 py-2 text-left">{s.label}</th>
              ))}
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-left">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.member.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-medium">{it.member.name || it.member.email}</div>
                  <div className="text-xs text-gray-500">{it.member.email}</div>
                </td>
                {STATUSES.map((s) => (
                  <td key={s.key as string} className="px-3 py-2">
                    <Link
                      href={`/my-tasks?assigneeId=${it.member.id}${s.status ? `&status=${s.status}` : ""}`}
                      className="inline-block px-2 py-1 rounded border hover:bg-gray-50"
                    >
                      {it.counts[s.key] as number}
                    </Link>
                  </td>
                ))}
                <td className="px-3 py-2">{it.counts.totalActive}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{it.lastActivityAt ? new Date(it.lastActivityAt).toLocaleString() : "—"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td className="px-3 py-3" colSpan={STATUSES.length + 3}>Không có thành viên nào trong team.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


