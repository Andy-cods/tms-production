"use client";

import type { ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  PieChart,
  Target,
  TrendingUp,
  Users,
  Trophy,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

type RequestStats = {
  total: number;
  backlog: number;
  inProgress: number;
  completed: number;
  overdue: number;
  unassigned: number;
  rejected: number;
  archived: number;
  draft: number;
};

type TaskStats = {
  total: number;
  active: number;
  todo: number;
  inProgress: number;
  inReview: number;
  rework: number;
  waiting: number;
  blocked: number;
  done: number;
};

type TeamSummary = {
  id: string;
  name: string;
  memberCount: number;
  capacity: number;
  activeTasks: number;
  utilization: number;
  totalRequests: number;
  backlogRequests: number;
  inProgressRequests: number;
  doneRequests: number;
  overdueRequests: number;
};

type TopUser = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  teamName: string | null;
  count: number;
};

type RecentRequest = {
  id: string;
  title: string;
  status: string;
  priority: string;
  teamName: string | null;
  categoryName: string | null;
  createdAt: string;
  deadline: string | null;
};

interface AdminOverviewClientProps {
  requestStats: RequestStats;
  taskStats: TaskStats;
  teamSummaries: TeamSummary[];
  topActiveAssignees: TopUser[];
  topCompleters: TopUser[];
  recentRequests: RecentRequest[];
}

const requestStatusStyles: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  DRAFT: { label: "Bản nháp", className: "bg-slate-100 text-slate-700" },
  OPEN: { label: "Mới", className: "bg-blue-100 text-blue-700" },
  IN_TRIAGE: { label: "Phân loại", className: "bg-indigo-100 text-indigo-700" },
  ASSIGNED: { label: "Đã giao", className: "bg-amber-100 text-amber-700" },
  IN_PROGRESS: { label: "Đang xử lý", className: "bg-sky-100 text-sky-700" },
  IN_REVIEW: { label: "Chờ duyệt", className: "bg-purple-100 text-purple-700" },
  CLARIFICATION: { label: "Cần làm rõ", className: "bg-orange-100 text-orange-700" },
  REJECTED: { label: "Từ chối", className: "bg-rose-100 text-rose-700" },
  DONE: { label: "Hoàn thành", className: "bg-emerald-100 text-emerald-700" },
  ARCHIVED: { label: "Đã lưu trữ", className: "bg-zinc-100 text-zinc-700" },
};

const priorityStyles: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  URGENT: { label: "Khẩn cấp", className: "bg-rose-100 text-rose-700" },
  HIGH: { label: "Cao", className: "bg-orange-100 text-orange-700" },
  MEDIUM: { label: "Trung bình", className: "bg-yellow-100 text-yellow-700" },
  LOW: { label: "Thấp", className: "bg-slate-100 text-slate-700" },
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  accent = "text-primary-600",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  description?: string;
  accent?: string;
}) {
  return (
    <Card className="border-none shadow-sm bg-white/80 backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {value.toLocaleString("vi-VN")}
            </p>
            {description ? (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            ) : null}
          </div>
          <span
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-50",
              accent
            )}
          >
            <Icon className="h-6 w-6" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function TopUserListCard({
  title,
  description,
  users,
  icon: Icon,
}: {
  title: string;
  description: string;
  users: TopUser[];
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
        ) : (
          <ul className="space-y-4">
            {users.map((user) => {
              const initials =
                user.name?.split(" ").map((part) => part[0]).join("") ||
                user.email?.[0] ||
                "?";

              return (
                <li key={user.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar fallback={initials} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.teamName || "Chưa gán team"} · {user.role}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {user.count} việc
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminOverviewClient({
  requestStats,
  taskStats,
  teamSummaries,
  topActiveAssignees,
  topCompleters,
  recentRequests,
}: AdminOverviewClientProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1600px] px-6 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển Admin</h1>
            <p className="text-muted-foreground mt-1">
              Tổng quan theo thời gian thực về yêu cầu, task và hiệu suất từng phòng ban.
            </p>
          </div>
          <Badge variant="outline" className="px-3 py-1 text-xs">
            Cập nhật tới{" "}
            {format(new Date(), "HH:mm dd/MM/yyyy", {
              locale: vi,
            })}
          </Badge>
        </div>

        {/* Request KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SummaryCard
            icon={BarChart3}
            label="Tổng số yêu cầu"
            value={requestStats.total}
            description={`${requestStats.draft} bản nháp · ${requestStats.archived} đã lưu trữ`}
          />
          <SummaryCard
            icon={Clock}
            label="Backlog"
            value={requestStats.backlog}
            description={`${requestStats.unassigned} chưa gán team`}
            accent="text-amber-600"
          />
          <SummaryCard
            icon={Activity}
            label="Đang xử lý"
            value={requestStats.inProgress}
            accent="text-sky-600"
            description={`${requestStats.rejected} bị trả về`}
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Hoàn thành"
            value={requestStats.completed}
            accent="text-emerald-600"
          />
          <SummaryCard
            icon={AlertTriangle}
            label="Quá hạn"
            value={requestStats.overdue}
            accent="text-rose-600"
          />
          <SummaryCard
            icon={ClipboardCheck}
            label="Task đang mở"
            value={taskStats.active}
            accent="text-indigo-600"
            description={`${taskStats.done.toLocaleString("vi-VN")} đã hoàn thành`}
          />
        </div>

        {/* Task Stats */}
        <Card className="shadow-sm border-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PieChart className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Trạng thái task toàn hệ thống</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Theo dõi số lượng task theo trạng thái hiện tại
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusBreakdown label="Todo" count={taskStats.todo} tone="bg-slate-100 text-slate-700" />
              <StatusBreakdown label="In Progress" count={taskStats.inProgress} tone="bg-sky-100 text-sky-700" />
              <StatusBreakdown label="In Review" count={taskStats.inReview} tone="bg-purple-100 text-purple-700" />
              <StatusBreakdown label="Rework" count={taskStats.rework} tone="bg-amber-100 text-amber-700" />
              <StatusBreakdown label="Blocked" count={taskStats.blocked} tone="bg-rose-100 text-rose-700" />
              <StatusBreakdown label="Đợi subtasks" count={taskStats.waiting} tone="bg-zinc-100 text-zinc-700" />
              <StatusBreakdown label="Hoàn thành" count={taskStats.done} tone="bg-emerald-100 text-emerald-700" />
              <StatusBreakdown label="Tổng task" count={taskStats.total} tone="bg-slate-900 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Team overview */}
        <Card className="shadow-sm border-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Tổng quan theo phòng ban</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Sức chứa, khối lượng công việc và trạng thái xử lý của từng team
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Team</TableHead>
                    <TableHead className="text-center">Thành viên</TableHead>
                    <TableHead className="text-center">Sức chứa</TableHead>
                    <TableHead className="text-center">Task đang mở</TableHead>
                    <TableHead className="min-w-[180px]">Utilization</TableHead>
                    <TableHead className="text-center">Backlog</TableHead>
                    <TableHead className="text-center">Đang xử lý</TableHead>
                    <TableHead className="text-center">Hoàn thành</TableHead>
                    <TableHead className="text-center">Quá hạn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                        Chưa có dữ liệu phòng ban
                      </TableCell>
                    </TableRow>
                  ) : (
                    teamSummaries.map((team) => (
                      <TableRow key={team.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-900">{team.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {team.totalRequests.toLocaleString("vi-VN")} yêu cầu
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{team.memberCount}</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {team.capacity.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {team.activeTasks.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{team.utilization}%</span>
                              <span>{team.activeTasks}/{team.capacity}</span>
                            </div>
                            <Progress value={Math.min(team.utilization, 100)} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-600">
                          {team.backlogRequests}
                        </TableCell>
                        <TableCell className="text-center text-sm text-sky-600">
                          {team.inProgressRequests}
                        </TableCell>
                        <TableCell className="text-center text-sm text-emerald-600">
                          {team.doneRequests}
                        </TableCell>
                        <TableCell className="text-center text-sm text-rose-600 font-medium">
                          {team.overdueRequests}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Top performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopUserListCard
            title="Top người đang xử lý nhiều task"
            description="Tính theo số task còn mở (TODO/IN_PROGRESS/REVIEW)"
            users={topActiveAssignees}
            icon={TrendingUp}
          />
          <TopUserListCard
            title="Top người hoàn thành trong 7 ngày"
            description="Dựa trên số task hoàn thành (status DONE)"
            users={topCompleters}
          icon={Trophy}
          />
        </div>

        {/* Recent requests */}
        <Card className="shadow-sm border-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Yêu cầu mới nhất</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Theo dõi các yêu cầu vừa được tạo và trạng thái hiện tại
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-center">Độ ưu tiên</TableHead>
                    <TableHead className="text-center">Phòng ban</TableHead>
                    <TableHead className="text-center">Phân loại</TableHead>
                    <TableHead className="text-center">Tạo cách đây</TableHead>
                    <TableHead className="text-center">Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        Chưa có yêu cầu nào được tạo gần đây
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentRequests.map((req) => {
                      const statusStyle =
                        requestStatusStyles[req.status] ??
                        requestStatusStyles.OPEN;
                      const priorityStyle =
                        priorityStyles[req.priority] ??
                        priorityStyles.MEDIUM;
                      const createdDistance = formatDistanceToNow(new Date(req.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      });
                      const deadlineLabel = req.deadline
                        ? format(new Date(req.deadline), "dd/MM/yyyy HH:mm", {
                            locale: vi,
                          })
                        : "—";
                      return (
                        <TableRow key={req.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{req.title}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={cn(
                                "text-xs font-medium",
                                statusStyle.className
                              )}
                            >
                              {statusStyle.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={cn(
                                "text-xs font-medium",
                                priorityStyle.className
                              )}
                            >
                              {priorityStyle.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {req.teamName}
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {req.categoryName}
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {createdDistance}
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {deadlineLabel}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBreakdown({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-transparent px-4 py-3 shadow-sm bg-white",
        "flex items-center justify-between"
      )}
    >
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-lg font-semibold text-gray-900">
          {count.toLocaleString("vi-VN")}
        </p>
      </div>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold",
          tone
        )}
      >
        {label}
      </span>
    </div>
  );
}


