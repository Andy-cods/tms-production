"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  Pause,
  MessageSquare,
  Paperclip,
  UserCog,
  AlertTriangle,
  Trash2,
  MoreVertical,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTaskStatusAction } from "@/actions/task";
import { updateTaskPriority, deleteTask } from "@/actions/task";

interface QuickActionsMenuProps {
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    deadline: string | null;
    assigneeId: string | null;
    requestId?: string;
  };
  currentUserId: string;
  currentUserRole: string;
  onActionComplete?: () => void;
}

export function QuickActionsMenu({
  task,
  currentUserId,
  currentUserRole,
  onActionComplete,
}: QuickActionsMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const canDelete = 
    currentUserRole === "ADMIN" || 
    task.assigneeId === currentUserId;

  const handleMarkDone = async () => {
    try {
      const formData = new FormData();
      formData.append("taskId", task.id);
      formData.append("status", "DONE");
      
      await updateTaskStatusAction(formData);
      alert("Đã đánh dấu hoàn thành!");
      onActionComplete?.();
      router.refresh();
    } catch (error) {
      alert("Lỗi: Không thể cập nhật");
    }
  };

  const handlePauseSLA = () => {
    const requestId = task.requestId || task.id;
    router.push(`/requests/${requestId}?action=pause-sla`);
  };

  const handleAddComment = () => {
    const requestId = task.requestId || task.id;
    router.push(`/requests/${requestId}?action=comment`);
  };

  const handleAddAttachment = () => {
    const requestId = task.requestId || task.id;
    router.push(`/requests/${requestId}?action=upload`);
  };

  const handleReassign = () => {
    const requestId = task.requestId || task.id;
    router.push(`/requests/${requestId}?action=reassign`);
  };

  const handleChangePriority = async (newPriority: string) => {
    try {
      const result = await updateTaskPriority(task.id, newPriority);
      if (result.success) {
        alert("Đã đổi độ ưu tiên!");
        onActionComplete?.();
        router.refresh();
      } else {
        alert("Lỗi: " + (result.error || "Không thể cập nhật"));
      }
    } catch (error) {
      alert("Lỗi: Không thể cập nhật");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Xóa task "${task.title}"?`)) return;

    try {
      const result = await deleteTask(task.id);
      if (result.success) {
        alert("Đã xóa task!");
        onActionComplete?.();
        router.refresh();
      } else {
        alert("Lỗi: " + (result.error || "Không thể xóa"));
      }
    } catch (error) {
      alert("Lỗi: Không thể xóa");
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* View Task */}
        <DropdownMenuItem onClick={() => router.push(`/my-tasks/${task.id}`)}>
          <Eye className="mr-2 h-4 w-4 text-blue-600" />
          Xem chi tiết
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Quick Actions */}
        {task.status !== "DONE" && (
          <DropdownMenuItem onClick={handleMarkDone}>
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
            Đánh dấu hoàn thành
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={handlePauseSLA}>
          <Pause className="mr-2 h-4 w-4 text-orange-600" />
          Tạm dừng SLA
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Add Actions */}
        <DropdownMenuItem onClick={handleAddComment}>
          <MessageSquare className="mr-2 h-4 w-4 text-blue-600" />
          Thêm comment
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleAddAttachment}>
          <Paperclip className="mr-2 h-4 w-4 text-purple-600" />
          Đính kèm file
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Modify Actions */}
        <DropdownMenuItem onClick={handleReassign}>
          <UserCog className="mr-2 h-4 w-4 text-indigo-600" />
          Chuyển người khác
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
            Đổi độ ưu tiên
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleChangePriority("LOW")}>
              <span className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
              Thấp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleChangePriority("MEDIUM")}>
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              Trung bình
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleChangePriority("HIGH")}>
              <span className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
              Cao
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleChangePriority("URGENT")}>
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
              Khẩn cấp
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa task
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

