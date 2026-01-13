"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormError } from "@/components/ui/form-error";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { updateRequestAction } from "@/actions/requests";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";
import { Priority } from "@prisma/client";

interface EditRequestFormProps {
  request: {
    id: string;
    title: string;
    description: string;
    priority: Priority;
    deadline: Date | null;
    teamId: string | null;
    categoryId: string | null;
    createdFromTemplateId: string | null;
    category?: { id: string; name: string; teamId: string | null } | null;
    team?: { id: string; name: string } | null;
  };
  categories: Array<{ id: string; name: string; teamId: string | null }>;
  teams: Array<{ id: string; name: string }>;
  isCatalogRequest: boolean;
}

const priorityOptions = [
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
  { value: "URGENT", label: "Khẩn cấp" },
];

export function EditRequestForm({
  request,
  categories,
  teams,
  isCatalogRequest,
}: EditRequestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      title: request.title,
      description: request.description,
      teamId: request.teamId || "",
      deadline: request.deadline ? new Date(request.deadline).toISOString().slice(0, 16) : "",
      priority: request.priority,
      categoryId: request.categoryId || "",
    },
  });

  const selectedTeamId = watch("teamId");
  const selectedCategoryId = watch("categoryId");

  const onSubmit = async (data: any) => {
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      
      // Chỉ thêm các field này nếu không phải catalog request
      if (!isCatalogRequest) {
        if (data.teamId) formData.append("teamId", data.teamId);
        if (data.deadline) formData.append("deadline", data.deadline);
        if (data.priority) formData.append("priority", data.priority);
        if (data.categoryId) formData.append("categoryId", data.categoryId);
      }

      const result = await updateRequestAction(request.id, formData);

      if (result.ok) {
        toast.success(result.message || "Đã cập nhật yêu cầu thành công");
        router.push(`/requests/${request.id}`);
        router.refresh();
      } else {
        setError(result.message || "Có lỗi xảy ra khi cập nhật");
        toast.error(result.message || "Có lỗi xảy ra khi cập nhật");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        {/* Tiêu đề */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Tiêu đề <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            {...register("title", {
              required: "Tiêu đề là bắt buộc",
              minLength: { value: 5, message: "Tiêu đề phải có ít nhất 5 ký tự" },
              maxLength: { value: 200, message: "Tiêu đề không được vượt quá 200 ký tự" },
            })}
            placeholder="Nhập tiêu đề yêu cầu"
            className="w-full"
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message as string}</p>
          )}
        </div>

        {/* Nội dung */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Nội dung <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            {...register("description", {
              required: "Nội dung là bắt buộc",
              maxLength: { value: 5000, message: "Nội dung không được vượt quá 5000 ký tự" },
            })}
            placeholder="Nhập nội dung chi tiết yêu cầu"
            rows={6}
            className="w-full"
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>

        {/* Catalog notice */}
        {isCatalogRequest && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Lưu ý:</strong> Yêu cầu này được tạo từ catalog template. 
              Chỉ có thể chỉnh sửa <strong>Tiêu đề</strong> và <strong>Nội dung</strong>.
              Các thông tin khác (Phòng ban, Deadline, Độ ưu tiên, Phân loại) đã được cố định bởi template.
            </p>
          </div>
        )}

        {/* Phòng ban - Chỉ cho custom requests */}
        {!isCatalogRequest && (
          <>
            <div className="space-y-2">
              <Label htmlFor="teamId">Phòng ban</Label>
              <Select
                value={selectedTeamId}
                onValueChange={(value) => setValue("teamId", value)}
              >
                <SelectTrigger id="teamId" className="w-full">
                  <SelectValue placeholder="Chọn phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không chọn</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phân loại */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">Phân loại</Label>
              <Select
                value={selectedCategoryId}
                onValueChange={(value) => setValue("categoryId", value)}
              >
                <SelectTrigger id="categoryId" className="w-full">
                  <SelectValue placeholder="Chọn phân loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không chọn</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                {...register("deadline")}
                className="w-full"
              />
            </div>

            {/* Độ ưu tiên */}
            <div className="space-y-2">
              <Label htmlFor="priority">Độ ưu tiên</Label>
              <Select
                value={watch("priority")}
                onValueChange={(value) => setValue("priority", value as Priority)}
              >
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Error message */}
        {error && <FormError message={error} />}

        {/* Actions */}
        <div className="flex gap-3 pt-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
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
      </div>
    </form>
  );
}

