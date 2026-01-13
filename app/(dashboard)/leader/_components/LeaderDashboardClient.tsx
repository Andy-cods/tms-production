"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Clock, CheckCircle2, AlertCircle, TrendingUp, Users, Search, Filter, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { AssignDialog } from "@/components/leader/assign-dialog";
import { toast } from "sonner";

export function LeaderDashboardClient({ requests, teamMembers, stats, isAdmin }: any) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignState, setAssignState] = useState<{ open: boolean; request: any | null }>({ open: false, request: null });

  const lowerSearch = search.toLowerCase();
  const assignmentHint = isAdmin
    ? "Admin có thể phân công cho bất kỳ phòng ban nào."
    : "Leader chỉ có thể phân công thành viên trong phòng ban của mình.";

  const filteredRequests = useMemo(() => {
    return requests.filter((req: any) => {
      const titleMatch = req.title?.toLowerCase().includes(lowerSearch);
      const creatorMatch =
        req.creator?.name?.toLowerCase().includes(lowerSearch) ||
        req.creator?.email?.toLowerCase().includes(lowerSearch);
      const matchSearch = !search || titleMatch || creatorMatch;
      const matchStatus = statusFilter === "all" || req.status === statusFilter;
      const matchPriority = priorityFilter === "all" || req.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [requests, search, lowerSearch, statusFilter, priorityFilter]);

  const firstUnassignedRequest = useMemo(() => {
    return requests.find((req: any) => !isRequestAssigned(req));
  }, [requests]);

  const handleOpenAssign = (request: any) => {
    if (!request) {
      toast.warning("Không có yêu cầu nào để phân công");
      return;
    }
    setAssignState({ open: true, request });
  };

  const closeAssignDialog = () => setAssignState({ open: false, request: null });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leader Dashboard</h1>
            <p className="text-gray-600 mt-1">Quản lý đội ngũ, phân công và theo dõi tiến độ</p>
            <p className="text-sm text-gray-400 mt-1">{assignmentHint}</p>
          </div>
          <Button
            className="bg-primary-500"
            onClick={() => handleOpenAssign(firstUnassignedRequest ?? filteredRequests[0])}
            disabled={!requests.length}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Phân công mới
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatsCard icon={Clock} label="Chưa phân công" value={stats?.pending ?? 0} color="orange" />
          <StatsCard icon={TrendingUp} label="Đang xử lý" value={stats?.inProgress ?? 0} color="blue" />
          <StatsCard icon={CheckCircle2} label="Hoàn thành" value={stats?.completed ?? 0} color="green" />
          <StatsCard icon={AlertCircle} label="Quá hạn" value={stats?.overdue ?? 0} color="red" />
          <StatsCard icon={Users} label="Thành viên" value={teamMembers.length} color="purple" />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Tìm kiếm yêu cầu, người tạo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="OPEN">Đang mở</SelectItem>
                  <SelectItem value="IN_TRIAGE">Đang phân loại</SelectItem>
                  <SelectItem value="ASSIGNED">Đã giao</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang xử lý</SelectItem>
                  <SelectItem value="IN_REVIEW">Đang duyệt</SelectItem>
                  <SelectItem value="DONE">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="URGENT">Khẩn cấp</SelectItem>
                  <SelectItem value="HIGH">Cao</SelectItem>
                  <SelectItem value="MEDIUM">Trung bình</SelectItem>
                  <SelectItem value="LOW">Thấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Table - FULL WIDTH */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách yêu cầu ({filteredRequests.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[50px]">STT</TableHead>
                    <TableHead className="min-w-[300px]">Tiêu đề</TableHead>
                    <TableHead className="min-w-[150px]">Phân loại</TableHead>
                    <TableHead className="min-w-[120px]">Trạng thái</TableHead>
                    <TableHead className="min-w-[120px]">Độ ưu tiên</TableHead>
                    <TableHead className="min-w-[180px]">Người tạo</TableHead>
                    <TableHead className="min-w-[150px]">Người xử lý</TableHead>
                    <TableHead className="min-w-[150px]">Thời gian</TableHead>
                    <TableHead className="w-[160px] text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-gray-500">Không tìm thấy yêu cầu nào</TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((request: any, index: number) => {
                      const assignedTask = getAssignedTask(request);

                      return (
                      <TableRow key={request.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => router.push(`/requests/${request.id}`)}>
                        <TableCell className="font-medium text-gray-500">{index + 1}</TableCell>

                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-900 hover:text-primary-600">{request.title}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">{request.description}</p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            {request.category?.icon && <span className="text-lg">{request.category.icon}</span>}
                            <span className="text-sm text-gray-700">{request.category?.name || "Chưa phân loại"}</span>
                </div>
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>

                        <TableCell>
                          <PriorityBadge priority={request.priority} />
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserAvatar user={request.creator} size={32} />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{request.creator?.name ?? "Không rõ"}</p>
                              <p className="text-xs text-gray-500">{request.creator?.email}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {assignedTask ? (
                            <div className="flex items-center gap-2">
                              <UserAvatar user={assignedTask.assignee} size={32} />
                              <span className="text-sm text-gray-700">{assignedTask.assignee?.name ?? assignedTask.assignee?.email}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Chưa phân công</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <p className="text-sm text-gray-600">
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: vi })}
                          </p>
                          {request.deadline && (
                            <p className="text-xs text-gray-500">Hạn: {new Date(request.deadline).toLocaleDateString("vi-VN")}</p>
                          )}
                        </TableCell>

                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAssign(request);
                            }}
                          >
                            Phân công
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/requests/${request.id}`);
                            }}
                          >
                            Chi tiết
                          </Button>
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

        {/* Team Members Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Thành viên đội ({teamMembers.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamMembers.map((member: any) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <UserAvatar user={member} size={48} showLevel />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                      <p className="text-sm text-gray-500 truncate">{member.email}</p>
                      {member.teamName && (
                        <p className="text-xs text-gray-400 truncate">{member.teamName}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Đang làm:</span>
                    <span className="font-bold text-primary-600">{(member.assignedTasks ?? []).length}</span>
                  </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">XP:</span>
                      <span className="font-bold text-orange-600">{member.stats?.experiencePoints ?? 0}</span>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => router.push(`/admin/users/${member.id}`)}>
                    Xem chi tiết
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
    </div>

      <AssignDialog
        open={assignState.open}
        onOpenChange={(open) => {
          if (!open) {
            closeAssignDialog();
          } else {
            setAssignState((prev) => ({ ...prev, open }));
          }
        }}
        requestId={assignState.request?.id ?? ""}
        requestTitle={assignState.request?.title ?? ""}
        teamMembers={teamMembers}
        loadingMembers={false}
      />
    </div>
  );
}

function isRequestAssigned(request: any) {
  if (!request?.tasks || !Array.isArray(request.tasks)) return false;
  return request.tasks.some((task: any) => Boolean(task?.assigneeId));
}

function getAssignedTask(request: any) {
  if (!request?.tasks || !Array.isArray(request.tasks)) return null;
  return request.tasks.find((task: any) => Boolean(task?.assigneeId)) ?? null;
}

function StatsCard({ icon: Icon, label, value, color }: any) {
  const colorMap: any = {
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
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
    OPEN: { label: "Mới", color: "bg-blue-100 text-blue-700" },
    IN_REVIEW: { label: "Đang duyệt", color: "bg-yellow-100 text-yellow-700" },
    DONE: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
    ARCHIVED: { label: "Lưu trữ", color: "bg-gray-100 text-gray-700" },
  };

  const { label, color } = statusMap[status] || statusMap.OPEN;

  return (
    <Badge className={`${color} border-0`} variant="outline">
      {label}
    </Badge>
  );
}

function PriorityBadge({ priority }: any) {
  const priorityMap: any = {
    LOW: { label: "Thấp", color: "bg-green-100 text-green-700" },
    MEDIUM: { label: "Trung bình", color: "bg-yellow-100 text-yellow-700" },
    HIGH: { label: "Cao", color: "bg-orange-100 text-orange-700" },
    URGENT: { label: "Khẩn cấp", color: "bg-red-100 text-red-700" },
  };

  const { label, color } = priorityMap[priority] || priorityMap.MEDIUM;

  return (
    <Badge className={`${color} border-0`} variant="outline">
      {label}
    </Badge>
  );
}

