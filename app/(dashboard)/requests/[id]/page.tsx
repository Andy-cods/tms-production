// app/(dashboard)/requests/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { RequestDetailClient } from "./_components/RequestDetailClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Ở Next.js 15, params có thể là Promise => khai báo kiểu Promise để await được
type Props = { params: Promise<{ id: string }> };

export default async function RequestDetailPage(props: Props) {
  // Await params trước khi dùng để tránh cảnh báo
  const { id } = await props.params;
  const session = await auth();

  const userId = session?.user ? (session.user as any).id : null;
  const userRole = session?.user ? (session.user as any).role : null;
  
  const [req, templates] = await Promise.all([
    prisma.request.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
        creator: { select: { name: true, email: true } },
        team: { 
          select: { 
            name: true, 
            leaderId: true,
            members: { select: { id: true } }
          } 
        },
        template: {
          include: {
            checklistItems: {
              orderBy: { order: "asc" },
            },
          },
        },
        attachments: true,
        comments: {
          include: { 
            author: { select: { name: true } } 
          },
          orderBy: { createdAt: "desc" },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: "desc" },
          where: {
            parentTaskId: null  // Only show top-level tasks, subtasks shown in SubtaskManager
          }
        },
      } as any,
    }) as any,
    prisma.taskTemplate.findMany({
      where: {
        OR: [
          { isPublic: true },
          ...(session?.user ? [{ createdById: session.user.id }] : []),
        ],
      },
      include: {
        checklistItems: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        usageCount: "desc",
      },
      take: 20,
    }),
  ]);

  // Get tasks with product links pending review (if user can review)
  // Leader thấy: PENDING, REJECTED (nếu Leader từ chối)
  // Requester thấy: LEADER_APPROVED, REJECTED (nếu Requester từ chối)
  const isLeader = req?.team?.leaderId === userId;
  const isRequester = req?.creatorId === userId;
  const isAdmin = userRole === "ADMIN";

  let reviewStatuses: string[] = [];
  if (isAdmin) {
    reviewStatuses = ["PENDING", "LEADER_APPROVED", "REJECTED"];
  } else if (isLeader) {
    reviewStatuses = ["PENDING", "REJECTED"]; // Leader chỉ thấy PENDING và REJECTED (nếu Leader từ chối)
  } else if (isRequester) {
    reviewStatuses = ["LEADER_APPROVED", "REJECTED"]; // Requester chỉ thấy LEADER_APPROVED và REJECTED (nếu Requester từ chối)
  }

  const tasksForReviewRaw = userId && req && reviewStatuses.length > 0
    ? await (prisma.task.findMany as any)({
        where: {
          requestId: id,
          productLink: { not: null },
          productLinkReviewStatus: { in: reviewStatuses },
          parentTaskId: null,
        },
        include: {
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { productLinkSubmittedAt: "desc" },
      })
    : [];

  // Fetch submitted by user info for each task
  const tasksForReview = await Promise.all(
    tasksForReviewRaw.map(async (task: any) => {
      const submittedByUser = task.productLinkSubmittedBy
        ? await prisma.user.findUnique({
            where: { id: task.productLinkSubmittedBy },
            select: { id: true, name: true },
          })
        : null;
      return { ...task, _submittedByUser: submittedByUser };
    })
  );

  if (!req) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-dark-900 mb-2">Không tìm thấy yêu cầu</h2>
          <p className="text-gray-600 mb-4">Yêu cầu này không tồn tại hoặc đã bị xóa.</p>
          <Link href="/requests">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Mock activity data (you should fetch from AuditLog in real implementation)
  const activities = [
    {
      id: "1",
      type: "created" as const,
      description: `Yêu cầu được tạo bởi ${req.creator?.name || "Người dùng"}`,
      createdAt: req.createdAt.toISOString(),
      user: req.creator ? { name: req.creator.name } : undefined,
    },
  ];

  // Helper functions
  const isOverdue = (deadline: Date | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  // Permission check: Admin can edit/delete any request
  // Leader can only edit/delete requests of their team
  const user = userId ? await prisma.user.findUnique({
    where: { id: userId },
    select: { teamId: true },
  }) : null;
  
  const canEdit = userRole === "ADMIN" || 
                  (userRole === "LEADER" && req.teamId && req.teamId === user?.teamId);
  const canDelete = userRole === "ADMIN";

  return (
    <RequestDetailClient
      request={req}
      session={session}
      activities={activities}
      canEdit={canEdit}
      canDelete={canDelete}
      templates={templates}
      tasksForReview={tasksForReview}
    />
  );
}
