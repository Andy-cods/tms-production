"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { assignTask } from "@/actions/task";
import { SlaBadge } from "@/components/sla/sla-badge";

type Task = {
  id: string;
  title: string;
  deadline: string | Date | null;
  createdAt?: string | Date;
  confirmationDeadline: Date | null;
  slaDeadline: Date | null;
  slaStatus: string | null;
  slaPausedAt: Date | null;
  slaTotalPaused: number | null;
  request: {
    id: string;
    title: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    category: { id: string; name: string } | null;
  } | null;
};

type Member = {
  id: string;
  name: string | null;
  email: string;
  _count: { tasksAssigned: number };
};

export default function InboxTable({ tasks, members }: { tasks: Task[]; members: Member[] }) {
  const router = useRouter();
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!tasks?.length) {
    return <div className="p-6 text-center text-gray-600">🎉 Không có task cần phân công</div>;
  }

  function priorityClass(p?: "LOW" | "MEDIUM" | "HIGH" | "URGENT") {
    switch (p) {
      case "URGENT":
        return "bg-red-100 text-red-700 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  async function onAssign(taskId: string, assigneeId: string) {
    setAssigningId(taskId);
    try {
      await assignTask(taskId, assigneeId);
      startTransition(() => router.refresh());
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-2 w-16">STT</th>
            <th className="p-2">Task</th>
            <th className="p-2">Request</th>
            <th className="p-2">Priority</th>
            <th className="p-2">Category</th>
            <th className="p-2">Deadline</th>
            <th className="p-2">SLA</th>
            <th className="p-2 w-64">Assign</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, index) => (
            <tr key={t.id} className="border-t">
              <td className="p-2">
                <span className="font-mono text-sm text-gray-500">
                  {index + 1}
                </span>
              </td>
              <td className="p-2">
                <Link className="text-blue-600 underline" href={`/tasks/${t.id}`}>{t.title}</Link>
              </td>
              <td className="p-2">
                {t.request && (
                  <Link className="text-blue-600 underline" href={`/requests/${t.request.id}`}>{t.request.title}</Link>
                )}
              </td>
              <td className="p-2">
                <span className={`inline-block px-2 py-0.5 rounded border text-xs ${priorityClass(t.request?.priority)}`}>
                  {t.request?.priority ?? "LOW"}
                </span>
              </td>
              <td className="p-2">{t.request?.category?.name ?? "—"}</td>
              <td className="p-2">{t.deadline ? new Date(t.deadline).toLocaleDateString() : "—"}</td>
              <td className="p-2">
                {(() => {
                  // Show confirmation deadline if not confirmed, otherwise show SLA deadline
                  const deadlineToShow = t.confirmationDeadline || t.slaDeadline;
                  
                  if (!deadlineToShow) return "—";
                  
                  return (
                    <SlaBadge 
                      deadline={deadlineToShow}
                      pausedDuration={t.slaTotalPaused || 0}
                      status={t.slaStatus || undefined}
                      showIcon={false}
                      variant="outline"
                    />
                  );
                })()}
              </td>
              <td className="p-2">
                <select
                  className="w-full border rounded px-2 py-1 disabled:opacity-50"
                  disabled={!!assigningId || isPending}
                  defaultValue=""
                  onChange={(e) => {
                    const assigneeId = e.target.value;
                    if (!assigneeId) return;
                    onAssign(t.id, assigneeId);
                  }}
                >
                  <option value="" disabled>
                    {assigningId === t.id ? "Đang giao..." : "Chọn người nhận"}
                  </option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {(m.name || m.email)} — {m._count?.tasksAssigned ?? 0}
                    </option>
                  ))}
                </select>
              </td>
            </tr>) )}
        </tbody>
      </table>
    </div>
  );
}


