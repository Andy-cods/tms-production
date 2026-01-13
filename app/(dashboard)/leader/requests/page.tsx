import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTeamRequests } from "@/lib/queries/leader";
import Link from "next/link";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const STATUS = ["OPEN", "IN_PROGRESS", "DONE"] as const;
const PRIORITY = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export default async function LeaderRequestsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
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

  const status = (typeof sp.status === "string" ? sp.status : undefined) as any;
  const priority = (typeof sp.priority === "string" ? sp.priority : undefined) as any;

  const items = await getTeamRequests(teamId, { status, priority });

  function pill(href: string, label: string, active: boolean) {
    return (
      <Link
        href={href}
        className={`px-3 py-1 rounded-full border text-sm ${active ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}
      >
        {label}
      </Link>
    );
  }

  const base = "/leader/requests";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team Requests</h2>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 mr-1">Status:</span>
        {pill(base, "All", !status)}
        {STATUS.map((s) => (
          <span key={s}>
            {pill(`${base}?status=${s}${priority ? `&priority=${priority}` : ""}`, s, status === s)}
          </span>
        ))}
        <span className="text-xs text-gray-500 mx-2">|</span>
        <span className="text-xs text-gray-500">Priority:</span>
        {pill(base + (status ? `?status=${status}` : ""), "All", !priority)}
        {PRIORITY.map((p) => (
          <span key={p}>
            {pill(`${base}?priority=${p}${status ? `&status=${status}` : ""}`, p, priority === p)}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2">Title</th>
              <th className="p-2">Creator</th>
              <th className="p-2">Status</th>
              <th className="p-2">Priority</th>
              <th className="p-2">Tasks</th>
              <th className="p-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="p-2">
                  <Link className="text-blue-600 underline" href={`/requests/${r.id}`}>{r.title}</Link>
                </td>
                <td className="p-2">{r.creator?.name || r.creator?.email}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.priority}</td>
                <td className="p-2">{r._count?.tasks ?? 0}</td>
                <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={6}>Không có request nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
