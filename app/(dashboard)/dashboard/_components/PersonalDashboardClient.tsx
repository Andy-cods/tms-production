"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  Plus,
  Target,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export function PersonalDashboardClient({
  user,
  myTasks,
  myRequests,
  stats,
}: any) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} size={80} showLevel />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Xin chào, {user?.name}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.team?.name || "Chưa thuộc team"}
              </p>
            </div>
          </div>

          <Button
            className="bg-primary-500 hover:bg-primary-600"
            onClick={() => router.push("/requests/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo yêu cầu mới
          </Button>
        </div>

        {/* Tabs: Overview | My Tasks | My Requests */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <Target className="h-4 w-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <Zap className="h-4 w-4" />
              Công việc ({stats.totalTasks})
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <FileText className="h-4 w-4" />
              Yêu cầu ({stats.totalRequests})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                icon={Clock}
                label="Cần làm"
                value={stats.todoTasks}
                color="orange"
              />
              <StatsCard
                icon={TrendingUp}
                label="Đang làm"
                value={stats.inProgressTasks}
                color="blue"
              />
              <StatsCard
                icon={CheckCircle2}
                label="Chờ duyệt"
                value={stats.inReviewTasks}
                color="green"
              />
              <StatsCard
                icon={AlertCircle}
                label="Quá hạn"
                value={stats.overdueTasks}
                color="red"
              />
            </div>

            {/* Gamification Quick View */}
            {user?.stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Thành tích</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Level</p>
                      <p className="text-3xl font-bold text-primary-600">
                        {user.stats.level}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.stats.experiencePoints} XP
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Streak</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {user.stats.currentStreak}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">ngày liên tiếp</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Hoàn thành</p>
                      <p className="text-3xl font-bold text-green-600">
                        {user.stats.totalTasksCompleted}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">công việc</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">SLA</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {user.stats.slaCompliantCount + user.stats.slaViolationCount > 0
                          ? Math.round(
                              (user.stats.slaCompliantCount /
                                (user.stats.slaCompliantCount +
                                  user.stats.slaViolationCount)) *
                                100
                            )
                          : 0}
                        %
                      </p>
                      <p className="text-xs text-gray-500 mt-1">tuân thủ</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-6"
                    onClick={() => router.push("/gaming")}
                  >
                    Xem tất cả thành tích →
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push("/requests")}
              >
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">📋 Danh sách yêu cầu</h3>
                  <p className="text-sm text-gray-600">
                    Xem tất cả yêu cầu trong hệ thống
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push("/profile")}
              >
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">👤 Hồ sơ cá nhân</h3>
                  <p className="text-sm text-gray-600">
                    Cập nhật avatar, thông tin và cài đặt
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: MY TASKS (Merged from old page) */}
          <TabsContent value="tasks" className="space-y-4">
            {myTasks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <p className="text-gray-500 text-lg">
                    Bạn chưa có công việc nào!
                  </p>
                </CardContent>
              </Card>
            ) : (
              myTasks.map((task: any) => (
                <TaskCard key={task.id} task={task} router={router} />
              ))
            )}
          </TabsContent>

          {/* TAB 3: MY REQUESTS */}
          <TabsContent value="requests" className="space-y-4">
            {myRequests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500 mb-4">
                    Bạn chưa tạo yêu cầu nào
                  </p>
                  <Button
                    className="bg-primary-500"
                    onClick={() => router.push("/requests/new")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo yêu cầu đầu tiên
                  </Button>
                </CardContent>
              </Card>
            ) : (
              myRequests.map((request: any) => (
                <RequestCard key={request.id} request={request} router={router} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper Components
function TaskCard({ task, router }: any) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/my-tasks/${task.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg text-gray-900">
                {task.request.title}
              </h3>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.request.priority} />
            </div>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {task.description || task.request.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <UserAvatar user={task.request.creator} size={24} />
                <span>{task.request.creator.name}</span>
              </div>

              {task.deadline && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatDistanceToNow(new Date(task.deadline), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </div>
              )}

              {task.request.category && (
                <div className="flex items-center gap-1">
                  <span>{task.request.category.icon}</span>
                  <span>{task.request.category.name}</span>
                </div>
              )}
            </div>
          </div>

          <Button variant="outline" size="sm">
            Chi tiết →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RequestCard({ request, router }: any) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/requests/${request.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg text-gray-900">
                {request.title}
              </h3>
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
            </div>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {request.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>
                Tạo{" "}
                {formatDistanceToNow(new Date(request.createdAt), {
                  addSuffix: true,
                  locale: vi,
                })}
              </span>

              {request.tasks.length > 0 && request.tasks[0].assignee && (
                <div className="flex items-center gap-2">
                  <span>Người xử lý:</span>
                  <UserAvatar user={request.tasks[0].assignee} size={24} />
                  <span>{request.tasks[0].assignee.name}</span>
                </div>
              )}
            </div>
          </div>

          <Button variant="outline" size="sm">
            Chi tiết →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCard({ icon: Icon, label, value, color }: any) {
  const colorMap: any = {
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${colorMap[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: any) {
  const statusMap: any = {
    TODO: { label: "Chưa làm", color: "bg-gray-100 text-gray-700" },
    IN_PROGRESS: { label: "Đang làm", color: "bg-blue-100 text-blue-700" },
    IN_REVIEW: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700" },
    DONE: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
    OPEN: { label: "Mới", color: "bg-blue-100 text-blue-700" },
  };

  const { label, color } = statusMap[status] || statusMap.TODO;

  return (
    <Badge className={`${color} border-0 text-xs`} variant="outline">
      {label}
    </Badge>
  );
}

function PriorityBadge({ priority }: any) {
  const priorityMap: any = {
    LOW: { label: "Thấp", color: "bg-green-100 text-green-700" },
    MEDIUM: { label: "TB", color: "bg-yellow-100 text-yellow-700" },
    HIGH: { label: "Cao", color: "bg-orange-100 text-orange-700" },
    URGENT: { label: "Gấp", color: "bg-red-100 text-red-700" },
  };

  const { label, color } = priorityMap[priority] || priorityMap.MEDIUM;

  return (
    <Badge className={`${color} border-0 text-xs`} variant="outline">
      {label}
    </Badge>
  );
}


