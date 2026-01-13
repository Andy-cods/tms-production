"use client";

import { useTransition, useState } from "react";
import { createTaskForRequest } from "@/actions/task";
import { useRouter } from "next/navigation";

export default function NewTaskDialog({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div>
      <button className="px-3 py-2 rounded border" onClick={() => setOpen(true)}>+ New Task</button>
      {open && (
        <div className="mt-3 border rounded p-3">
          <form action={(fd: FormData) => start(async () => {
            try {
              const title = fd.get("title") as string;
              const description = fd.get("description") as string;
              const deadlineStr = fd.get("deadline") as string;
              const deadline = deadlineStr ? new Date(deadlineStr) : undefined;

              const res = await createTaskForRequest(requestId, {
                title,
                description,
                deadline,
              });
              if (!(res as any)?.ok) throw new Error("CREATE_FAILED");
              setOpen(false);
              router.refresh();
            } catch (e) {
              // eslint-disable-next-line no-alert
              alert("Không thể tạo task. Kiểm tra quyền hoặc dữ liệu đầu vào.");
            }
          })}>
            <input name="title" required placeholder="Tiêu đề" className="border rounded p-2 w-full mb-2" />
            <textarea name="description" placeholder="Mô tả" className="border rounded p-2 w-full mb-2" />
            <input name="deadline" type="date" className="border rounded p-2 mb-2" />
            <div className="flex gap-2">
              <button disabled={pending} className="px-3 py-2 rounded bg-black text-white">
                {pending ? "Đang tạo..." : "Tạo task"}
              </button>
              <button type="button" className="px-3 py-2 rounded border" onClick={() => setOpen(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
