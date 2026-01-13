"use client";

import { useActionState } from "react";
import { createTaskComment } from "@/actions/comment";

type State = { ok: boolean; error?: string };

export default function TaskCommentForm({ taskId }: { taskId: string }) {
  const action = async (_: State, fd: FormData): Promise<State> => {
    const content = (fd.get("content") as string | null)?.toString() ?? "";
    if (content.trim().length < 3) return { ok: false, error: "Tối thiểu 3 ký tự" };
    try {
      await createTaskComment({ taskId, content });
      return { ok: true };
    } catch {
      return { ok: false, error: "Không thể gửi bình luận" };
    }
  };

  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: false });

  return (
    <form action={formAction} className="flex items-start gap-2">
      <textarea name="content" rows={2} placeholder="Bình luận..." className="border rounded px-2 py-1 text-xs min-w-[180px]" />
      <button disabled={pending} className="px-2 py-1 border rounded text-xs">
        {pending ? "Đang gửi..." : "Gửi"}
      </button>
      {state.error && <span className="text-[10px] text-red-600">{state.error}</span>}
    </form>
  );
}


