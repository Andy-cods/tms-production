import { prisma } from "@/lib/prisma";
import TaskCommentForm from "./task-comment-form";

export default async function TaskComments({ taskId }: { taskId: string }) {
  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: { 
      author: { 
        select: { 
          id: true,
          name: true,
        } 
      } 
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-gray-500">Comments</div>
      <div className="space-y-1 max-w-sm">
        {comments.map((c) => (
          <div key={c.id} className="border rounded p-1">
            <div className="text-[10px] text-gray-500 flex justify-between">
              <span>{c.author?.name || "Ẩn danh"}</span>
              <span>{new Date(c.createdAt).toLocaleString("vi-VN")}</span>
            </div>
            <div className="whitespace-pre-wrap text-xs mt-1">{c.content}</div>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-xs text-gray-400">Chưa có bình luận.</div>
        )}
      </div>
      <TaskCommentForm taskId={taskId} />
    </div>
  );
}


