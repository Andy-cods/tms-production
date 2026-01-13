"use client";

import { useActionState } from "react";
import { addRequestComment } from "@/actions/comment";

type Props = { requestId: string };

type FormState = { ok: boolean; error?: string };

export default function CommentForm({ requestId }: Props) {
  const submit = async (_: FormState, formData: FormData): Promise<FormState> => {
    const content = (formData.get("content") as string | null)?.toString() ?? "";
    if (content.trim().length < 3) {
      return { ok: false, error: "Nội dung bình luận phải có ít nhất 3 ký tự" };
    }
    try {
      await addRequestComment({ requestId, content });
      // success -> let server revalidate; return ok to clear UI
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Không thể gửi bình luận" };
    }
  };

  const [state, formAction, isPending] = useActionState<FormState, FormData>(submit, { ok: false });

  return (
    <form action={formAction} className="space-y-2">
      <textarea
        name="content"
        rows={3}
        required
        minLength={3}
        maxLength={1000}
        placeholder="Viết bình luận..."
        className="w-full border rounded px-3 py-2"
      />
      {state.error && <div className="text-red-600 text-sm">{state.error}</div>}
      <div className="flex justify-end">
        <button
          disabled={isPending}
          className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
        >
          {isPending ? "Đang gửi..." : "Gửi bình luận"}
        </button>
      </div>
    </form>
  );
}


