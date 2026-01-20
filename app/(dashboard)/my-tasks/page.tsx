import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MyTasksClient } from "./_components/MyTasksClient";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CheckSquare } from "lucide-react";

export default async function MyTasksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  // Fetch all tasks assigned to current user
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
    },
    include: {
      request: {
        select: {
          id: true,
          title: true,
          priority: true,
        },
      },
      slaPauseLogs: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          pausedAt: "desc",
        },
      },
      _count: {
        select: {
          slaPauseLogs: true,
        },
      },
    },
    orderBy: [
      { status: "asc" }, // TODO first, then IN_PROGRESS, etc.
      { deadline: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Also fetch requests where user is involved (created by or has tasks assigned)
  const myRequests = await prisma.request.findMany({
    where: {
      OR: [
        { creatorId: userId },
        {
          tasks: {
            some: {
              assigneeId: userId,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      deadline: true,
      team: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const todoTasks = tasks.filter((t) => t.status === "TODO").length;
  const overdueTasks = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== "DONE"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: "Trang chủ", href: "/dashboard" },
              { label: "Công việc của tôi" },
            ]}
          />
          <div className="flex items-center gap-3 mt-2">
            <div className="p-2 bg-primary-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Công việc của tôi</h1>
              <p className="text-gray-600">Quản lý các nhiệm vụ được giao cho bạn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Tổng số</p>
          <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Chờ xử lý</p>
          <p className="text-2xl font-bold text-blue-600">{todoTasks}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Đang làm</p>
          <p className="text-2xl font-bold text-yellow-600">{inProgressTasks}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Hoàn thành</p>
          <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Quá hạn</p>
          <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
        </div>
      </div>

      {/* Related Requests Section */}
      {myRequests.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Yêu cầu liên quan</h3>
          <div className="space-y-2">
            {myRequests.slice(0, 5).map((req) => (
              <a
                key={req.id}
                href={`/requests/${req.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      req.status === "DONE"
                        ? "bg-green-100 text-green-700"
                        : req.status === "IN_PROGRESS" || req.status === "IN_REVIEW"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {req.status}
                  </span>
                  <span className="font-medium text-gray-900">{req.title}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{req.team?.name || "—"}</span>
                  <span>•</span>
                  <span>{req._count.tasks} tasks</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tasks List/Kanban */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Danh sách nhiệm vụ</h3>
        <MyTasksClient
          tasks={tasks as any}
          currentUserId={userId}
          currentUserRole={userRole}
        />
      </div>
    </div>
  );
}
