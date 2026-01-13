"use client";

import { useState } from "react";
import { 
  CheckSquare, 
  Square, 
  MoreVertical, 
  Filter,
  Download,
  UserPlus,
  Archive,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Request {
  id: string;
  title: string;
  status: "OPEN" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "REJECTED" | "ARCHIVED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: {
    name: string;
  };
  creator: {
    name: string;
  };
  createdAt: string;
  deadline: string;
  _count: {
    tasks: number;
  };
}

interface RequestsTabProps {
  requests?: Request[];
  isLoading?: boolean;
  onBulkAction?: (action: string, requestIds: string[]) => void;
}

export function RequestsTab({ 
  requests = [], 
  isLoading = false, 
  onBulkAction 
}: RequestsTabProps) {
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "DONE":
        return "default";
      case "IN_PROGRESS":
        return "secondary";
      case "IN_REVIEW":
        return "outline";
      case "REJECTED":
        return "destructive";
      case "ARCHIVED":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-green-100 text-green-700 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "IN_REVIEW":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-700 border-red-200";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "default";
      case "MEDIUM":
        return "secondary";
      case "LOW":
        return "outline";
      default:
        return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-700 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "LOW":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(requests.map(r => r.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests(prev => [...prev, requestId]);
    } else {
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
    }
  };

  const handleBulkAction = (action: string) => {
    if (onBulkAction && selectedRequests.length > 0) {
      onBulkAction(action, selectedRequests);
      setSelectedRequests([]);
      setShowBulkActions(false);
    }
  };

  const isAllSelected = selectedRequests.length === requests.length && requests.length > 0;
  const isIndeterminate = selectedRequests.length > 0 && selectedRequests.length < requests.length;

  if (isLoading) {
    return <RequestsSkeleton />;
  }

  if (!requests?.length) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Filter className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Chưa có yêu cầu nào
        </h3>
        <p className="text-gray-600">
          Tất cả yêu cầu sẽ hiển thị ở đây
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Bulk Actions Bar - Consolidated */}
      {selectedRequests.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">
              {selectedRequests.length} yêu cầu đã chọn
            </span>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="bg-[#37b24d] hover:bg-[#2d8f3f]">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Phân công
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkAction("assign")}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Phân công hàng loạt
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkAction("archive")}>
                    <Archive className="w-4 h-4 mr-2" />
                    Lưu trữ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction("export")}>
                    <Download className="w-4 h-4 mr-2" />
                    Xuất Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRequests([])}
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-16">STT</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Phân loại</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Độ ưu tiên</TableHead>
              <TableHead>Người tạo</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Hạn chót</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request, index) => (
              <TableRow 
                key={request.id} 
                className="hover:bg-gray-50 transition-colors"
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRequests.includes(request.id)}
                    onCheckedChange={(checked) => 
                      handleSelectRequest(request.id, !!checked)
                    }
                    aria-label="Select row"
                  />
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm text-gray-500">
                    {index + 1}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900 hover:text-primary-600 cursor-pointer">
                    {request.title}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-gray-600">
                    {request.category.name}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={getStatusVariant(request.status)}
                    className={getStatusColor(request.status)}
                  >
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={getPriorityVariant(request.priority)}
                    className={getPriorityColor(request.priority)}
                  >
                    {request.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-gray-600">
                    {request.creator.name}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {format(new Date(request.createdAt), "dd/MM/yyyy", { locale: vi })}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {format(new Date(request.deadline), "dd/MM/yyyy", { locale: vi })}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-gray-600">
                    {request._count.tasks}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Phân công
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Xuất Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RequestsSkeleton() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-28"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              <div className="h-6 bg-gray-200 rounded-full w-12"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
