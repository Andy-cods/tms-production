"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTaskAction } from "@/actions/task";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";
import { DateTimePicker } from "@/components/ui/datetime-picker";

interface EditTaskFormProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    deadline: Date | null;
    assigneeId: string | null;
    createdFromTemplateId: string | null;
  };
  requestId: string;
  teamMembers: Array<{
    id: string;
    name: string | null;
    email: string | null;
  }>;
  isFixedTask: boolean;
}

export function EditTaskForm({
  task,
  requestId,
  teamMembers,
  isFixedTask,
}: EditTaskFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    deadline: task.deadline ? new Date(task.deadline) : null,
    assigneeId: task.assigneeId || "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim() || formData.title.trim().length < 5) {
      setError("Tiêu đề phải có ít nhất 5 ký tự");
      return;
    }

    startTransition(async () => {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("title", formData.title.trim());
      formDataToSubmit.append("description", formData.description || "");
      
      if (!isFixedTask) {
        // Custom task: allow deadline and assignee changes
        if (formData.deadline) {
          formDataToSubmit.append("deadline", formData.deadline.toISOString());
        }
        if (formData.assigneeId) {
          formDataToSubmit.append("assigneeId", formData.assigneeId);
        }
      }

      const result = await updateTaskAction(task.id, formDataToSubmit);

      if (result.ok) {
        toast.success("Thành công", result.message || "Đã cập nhật nhiệm vụ");
        router.push(`/requests/${requestId}`);
        router.refresh();
      } else {
        setError(result.message || "Lỗi cập nhật nhiệm vụ");
        toast.error("Lỗi", result.message || "Không thể cập nhật nhiệm vụ");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isFixedTask && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
          <p>
            <strong>Lưu ý:</strong> Đây là nhiệm vụ cố định (tạo từ template).
            <br />
            Chỉ có thể chỉnh sửa <strong>Tiêu đề</strong> và <strong>Nội dung</strong>.
            <br />
            Thời gian và người được giao không thể thay đổi.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Tiêu đề */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Tiêu đề <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Nhập tiêu đề nhiệm vụ"
          className="w-full"
          disabled={isPending}
          required
        />
      </div>

      {/* Nội dung */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Nội dung <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Nhập nội dung chi tiết nhiệm vụ"
          rows={6}
          className="w-full"
          disabled={isPending}
        />
      </div>

      {/* Custom task only: Deadline và Assignee */}
      {!isFixedTask && (
        <>
          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Hạn hoàn thành</Label>
            <DateTimePicker
              value={formData.deadline}
              onChange={(date) => setFormData({ ...formData, deadline: date || null })}
              placeholder="Chọn ngày và giờ hạn hoàn thành"
              disabled={isPending}
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Nếu có thay đổi về thời gian, Leader sẽ được thông báo để kiểm tra.
            </p>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label htmlFor="assigneeId">Người được giao</Label>
            <Select
              value={formData.assigneeId || undefined}
              onValueChange={(value) => setFormData({ ...formData, assigneeId: value || "" })}
              disabled={isPending}
            >
              <SelectTrigger id="assigneeId" className="w-full">
                <SelectValue placeholder="Chọn người được giao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Không chọn</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          <X className="w-4 h-4 mr-2" />
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

