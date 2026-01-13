import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getUserId } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmitDeliverableDialog } from "@/components/tasks/submit-deliverable-dialog";
import { SubmitProductLinkDialog } from "@/components/tasks/submit-product-link-dialog";
import { ProductLinkReviewSection } from "@/components/tasks/product-link-review-section";
import { UserAvatar } from "@/components/shared/user-avatar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { TaskStatus } from "@prisma/client";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const userId = getUserId(session);

  const task = await (prisma.task.findUnique as any)({
    where: { id },
    include: {
      request: {
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          creatorId: true,
          teamId: true,
          team: {
            select: {
              leaderId: true,
            },
          },
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      attachments: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!task) {
    notFound();
  }

  // Check if user is the assignee
  const isAssignee = task.assigneeId === userId;
  const canSubmit = isAssignee && (task.status === TaskStatus.TODO || task.status === TaskStatus.IN_PROGRESS);
  
  // Check if user can submit product link
  // Allow submission if:
  // 1. No product link yet, OR
  // 2. Product link was rejected (can resubmit), AND rejection count < 3
  // Allowed task statuses: IN_PROGRESS, DONE, REWORK, BLOCKED (làm rõ/review lại)
  // Also allow if Request is in CLARIFICATION status (làm rõ)
  const taskAny = task as any;
  const rejectionCount = taskAny.productLinkRejectionCount || 0;
  const requestStatus = task.request?.status;
  const isRequestClarification = requestStatus === "CLARIFICATION";
  const canSubmitProductLink = isAssignee && 
    (task.status === TaskStatus.IN_PROGRESS || 
     task.status === TaskStatus.DONE || 
     task.status === TaskStatus.REWORK ||
     task.status === TaskStatus.BLOCKED ||
     isRequestClarification) &&
    (!taskAny.productLink || (taskAny.productLinkReviewStatus === "REJECTED" && rejectionCount < 3));
  
  // Check if user can review product link
  const userRole = (session.user as any).role;
  const isLeader = task.request.team?.leaderId === userId;
  const isRequester = task.request.creatorId === userId;
  const isAdmin = userRole === "ADMIN";
  const productLinkStatus = taskAny.productLinkReviewStatus;
  const canReview = taskAny.productLink && (
    (productLinkStatus === "PENDING" && (isLeader || isAdmin)) ||
    (productLinkStatus === "LEADER_APPROVED" && (isRequester || isAdmin)) ||
    (productLinkStatus === "REJECTED" && (isLeader || isRequester || isAdmin))
  );
  
  // Get submitted by user info
  const submittedByUser = taskAny.productLinkSubmittedBy 
    ? await prisma.user.findUnique({
        where: { id: taskAny.productLinkSubmittedBy },
        select: { id: true, name: true },
      })
    : null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          <p className="text-gray-600 mt-1">
            Từ request: {task.request?.title ?? "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canSubmit && (
            <SubmitDeliverableDialog taskId={task.id} />
          )}
          {canSubmitProductLink && (
            <SubmitProductLinkDialog 
              taskId={task.id} 
              isResubmission={taskAny.productLinkReviewStatus === "REJECTED"}
              rejectionCount={rejectionCount}
            />
          )}
        </div>
      </div>

      {/* Task Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin công việc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Trạng thái</p>
              <StatusBadge status={task.request?.status as any} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Độ ưu tiên</p>
              <PriorityBadge priority={task.request.priority} />
            </div>
            {task.deadline && (
              <div>
                <p className="text-sm text-gray-500">Thời hạn</p>
                <p className="font-medium">
                  {format(new Date(task.deadline), "dd/MM/yyyy HH:mm", { locale: vi })}
                </p>
              </div>
            )}
            {task.assignee && (
              <div>
                <p className="text-sm text-gray-500">Người thực hiện</p>
                <p className="font-medium">{task.assignee.name ?? "Unknown"}</p>
              </div>
            )}
          </div>

          {task.description && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Mô tả</p>
              <p className="text-gray-900 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Link Review Section */}
      {canReview && task && (
        <ProductLinkReviewSection 
          task={{
            id: task.id,
            productLink: taskAny.productLink,
            productLinkSubmittedAt: taskAny.productLinkSubmittedAt,
            productLinkSubmittedBy: taskAny.productLinkSubmittedBy,
            productLinkReviewStatus: taskAny.productLinkReviewStatus,
            productLinkReviewedAt: taskAny.productLinkReviewedAt,
            productLinkReviewedBy: taskAny.productLinkReviewedBy,
            productLinkReviewComment: taskAny.productLinkReviewComment,
            assignee: task.assignee,
          }}
          submittedByUser={submittedByUser}
          session={session}
          isLeader={isLeader}
          isRequester={isRequester}
          isAdmin={isAdmin}
        />
      )}

      {/* Product Link Display (if approved or rejected) */}
      {task && taskAny.productLink && !canReview && (
        <Card>
          <CardHeader>
            <CardTitle>Link sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href={taskAny.productLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
              >
                {taskAny.productLink}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              {taskAny.productLinkReviewStatus === "APPROVED" && (
                <p className="text-sm text-green-600">✅ Đã được duyệt</p>
              )}
              {taskAny.productLinkReviewStatus === "REJECTED" && taskAny.productLinkReviewComment && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                  <p className="text-sm font-semibold text-red-800 mb-1">Lý do từ chối:</p>
                  <p className="text-sm text-red-700">{taskAny.productLinkReviewComment}</p>
                  {rejectionCount > 0 && (
                    <p className="text-xs text-red-600 mt-2">
                      Số lần từ chối: {rejectionCount}/3
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {task.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>File đính kèm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {task.attachments.map((att: any) => (
                <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{att.fileName}</p>
                    <p className="text-sm text-gray-500">
                      {att.uploadedBy?.name} • {format(new Date(att.createdAt), "dd/MM/yyyy", { locale: vi })}
                    </p>
                  </div>
                  {att.fileUrl ? (
                    <a
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      Xem file
                    </a>
                  ) : att.externalUrl ? (
                    <a
                      href={att.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      Mở link
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      {task.comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bình luận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {task.comments.map((comment: any) => (
                <div key={comment.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-start gap-3">
                    <UserAvatar user={{ id: comment.author.id, name: comment.author.name || "Unknown" }} size={32} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{comment.author.name}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </p>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

