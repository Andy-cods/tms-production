import { prisma } from "@/lib/prisma";
import { assignTaskAction, updateTaskStatusAction } from "@/actions/task";
import TaskComments from "./task-comments";
import NewTaskDialog from "./new-task-dialog";
import Link from "next/link";
import { Edit } from "lucide-react";

export default async function TaskList({ requestId }: { requestId: string }) {
  const [tasks, members] = await Promise.all([
    prisma.task.findMany({
      where: { requestId },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, status: true, deadline: true, assigneeId: true, assignee: { select: { id: true, name: true } } },
    }),
    // lấy user trong team của request (nếu có team)
    prisma.user.findMany({
      where: {
        team: { requests: { some: { id: requestId } } },
      },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Tasks</h3>
        <NewTaskDialog requestId={requestId} />
      </div>

      <div className="rounded border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Assignee</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Deadline</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-3 py-2">{t.title}</td>
                <td className="px-3 py-2">{t.assignee?.name ?? "-"}</td>
                <td className="px-3 py-2">{t.status}</td>
                <td className="px-3 py-2">{t.deadline ? new Date(t.deadline).toLocaleDateString() : "-"}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2 items-center flex-wrap">
                    {/* Edit */}
                    <Link
                      href={`/requests/${requestId}/tasks/${t.id}/edit`}
                      className="px-2 py-1 border rounded hover:bg-gray-50 flex items-center gap-1 text-sm"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Link>

                    {/* Assign */}
                    <form action={assignTaskAction} className="flex items-center gap-1">
                      <input type="hidden" name="taskId" value={t.id} />
                      <select name="assigneeId" defaultValue={t.assigneeId ?? ""} className="border rounded p-1 text-sm">
                        <option value="">-- assign --</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                      <button className="px-2 py-1 border rounded text-sm">Assign</button>
                    </form>

                    {/* Update status */}
                    <form action={updateTaskStatusAction} className="flex items-center gap-1">
                      <input type="hidden" name="taskId" value={t.id} />
                      <select name="status" defaultValue={t.status} className="border rounded p-1 text-sm">
                        {["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","REWORK","DONE"].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button className="px-2 py-1 border rounded text-sm">Update</button>
                    </form>
                    <TaskComments taskId={t.id} />
                  </div>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr><td className="px-3 py-3" colSpan={5}>Chưa có task.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
