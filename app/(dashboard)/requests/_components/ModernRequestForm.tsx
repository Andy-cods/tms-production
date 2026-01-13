"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, X, Upload, FileText, Loader2 } from "lucide-react";
import { createRequestSchema, type CreateRequestInput } from "@/lib/validations/request";
import { createRequestAction } from "@/actions/requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Radio } from "@/components/ui/radio";
import { FormError } from "@/components/ui/form-error";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { DeadlineRangePicker } from "@/components/requests/deadline-range-picker";
import { DeadlineDurationPicker } from "@/components/forms/deadline-duration-picker";
import { DateRangePicker } from "@/components/forms/date-range-picker";
import { CategoryTreeSelect } from "@/components/categories/category-tree-select";
import { cn } from "@/lib/utils";
import { addHours } from "date-fns";
import { getCatalogRule, computeFixedDeadline } from "@/lib/catalog";

type Category = { id: string; name: string };
type Team = { id: string; name: string };
type PriorityConfig = { id: string; question: string; weight: number; order: number };

interface ModernRequestFormProps {
  categories: Category[];
  teams: Team[];
  priorityConfigs: PriorityConfig[];
  initialData?: Partial<CreateRequestInput>;
  mode?: "create" | "edit";
}

const priorityOptions = [
  { value: "LOW", label: "Thấp", color: "bg-gray-100 border-gray-300 text-gray-700", icon: "🔵" },
  { value: "MEDIUM", label: "Trung bình", color: "bg-blue-100 border-blue-300 text-blue-700", icon: "🟡" },
  { value: "HIGH", label: "Cao", color: "bg-orange-100 border-orange-300 text-orange-700", icon: "🟠" },
  { value: "URGENT", label: "Khẩn cấp", color: "bg-red-100 border-red-300 text-red-700", icon: "🔴" },
];

export function ModernRequestForm({ 
  categories, 
  teams,
  priorityConfigs,
  initialData,
  mode = "create" 
}: ModernRequestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(initialData?.description?.length || 0);
  const [deadlineMode, setDeadlineMode] = useState<"deadline" | "duration">("deadline");
  const [duration, setDuration] = useState<number>(24);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    control,
  } = useForm<any>({
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      categoryId: initialData?.categoryId || "",
      teamId: (initialData as any)?.teamId || "",
      priority: initialData?.priority || "MEDIUM",
      deadline: initialData?.deadline || "",
      estimatedStartDate: (initialData as any)?.estimatedStartDate || "",
      estimatedEndDate: (initialData as any)?.estimatedEndDate || "",
      tags: initialData?.tags || [],
      isUrgent: initialData?.isUrgent || false,
      requesterType: initialData?.requesterType || "INTERNAL",
      attachments: initialData?.attachments || [],
      urgencyScore: initialData?.urgencyScore,
      impactScore: initialData?.impactScore,
      riskScore: initialData?.riskScore,
      customScores: initialData?.customScores,
    },
  });

  const selectedPriority = watch("priority");
  const requesterType = watch("requesterType");
  const description = watch("description");
  const templateId = watch("templateId");
  const currentTeamId = watch("teamId");
  const prevTeamIdRef = useRef<string | undefined>(initialData?.teamId);

  // Apply catalog rule: if template is in catalog and enforceFixedTime => lock deadline
  const catalogRule = getCatalogRule(templateId);

  useEffect(() => {
    if (catalogRule?.enforceFixedTime) {
      const fixed = computeFixedDeadline(catalogRule);
      setValue("deadline", fixed.toISOString());
      const diffMinutes = Math.max(1, Math.round((fixed.getTime() - Date.now()) / 60000));
      const hours = Math.max(1, Math.round(diffMinutes / 60));
      setDuration(hours);
    }
  }, [catalogRule, setValue]);

  // Clear category when team changes
  useEffect(() => {
    // Only clear if team actually changed (not on initial mount)
    if (prevTeamIdRef.current !== undefined && prevTeamIdRef.current !== currentTeamId) {
      setValue('categoryId', '');
    }
    prevTeamIdRef.current = currentTeamId;
  }, [currentTeamId, setValue])

  const onSubmit = async (data: any) => {
    // Validate with Zod first
    const validation = createRequestSchema.safeParse(data);
    if (!validation.success) {
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        setError(field, { message: issue.message });
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    if (data.categoryId) formData.append("categoryId", data.categoryId);
    if (data.teamId) formData.append("teamId", data.teamId);
    formData.append("priority", data.priority);
    if (data.deadline) formData.append("deadline", data.deadline);
    if (data.tags?.length) formData.append("tags", data.tags.join(","));
    if (data.isUrgent) formData.append("isUrgent", "true");
    if (data.templateId) formData.append("templateId", data.templateId);
    formData.append("requesterType", data.requesterType || "INTERNAL");

    startTransition(() => {
      createRequestAction(formData).then((result) => {
        if (!result.ok) {
          alert(`Lỗi: ${result.message}`);
          setIsSubmitting(false);
          return;
        }
        router.push("/requests");
      }).catch((error) => {
        console.error("Form submission error:", error);
        alert("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.");
        setIsSubmitting(false);
      });
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title" required>
          Tiêu đề
        </Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Nhập tiêu đề yêu cầu..."
          error={!!errors.title}
          disabled={isSubmitting}
        />
        {!errors.title && (
          <p className="text-sm text-gray-500 mt-1">5-200 ký tự</p>
        )}
        <FormError message={errors.title?.message as string} />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" required>
          Mô tả
        </Label>
        <Textarea
          id="description"
          {...register("description")}
          rows={6}
          placeholder="Mô tả chi tiết về yêu cầu..."
          error={!!errors.description}
          disabled={isSubmitting}
          onChange={(e) => {
            setCharCount(e.target.value.length);
            register("description").onChange(e);
          }}
        />
        <div className="flex items-center justify-between mt-1">
          <FormError message={errors.description?.message as string} />
          <p className="text-sm text-gray-500">{charCount}/5000</p>
        </div>
      </div>

      {/* Team, Category & Deadline Row */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* TEAM FIELD - ĐI TRƯỚC */}
        <div>
          <Label htmlFor="teamId" required>
            Bộ phận tiếp nhận
          </Label>
          <Select
            value={watch("teamId")}
            onValueChange={(value) => setValue("teamId", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="teamId">
              <SelectValue placeholder="Chọn bộ phận" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* CATEGORY FIELD - ĐI SAU */}
        <div>
          <CategoryTreeSelect
            value={watch("categoryId")}
            onChange={(value) => setValue("categoryId", value)}
            teamId={watch("teamId")}
            label={`Phân loại${templateId ? " *" : ""}`}
            required={!!templateId}
            disabled={isSubmitting}
            placeholder="Chọn phân loại"
          />
          <FormError message={errors.categoryId?.message as string} />
        </div>

        {/* Deadline field giữ nguyên */}
        <div>
          <DeadlineDurationPicker
            deadline={watch("deadline")}
            duration={duration}
            onDeadlineChange={(val) => setValue("deadline", val)}
            onDurationChange={(hours) => {
              setDuration(hours);
              const d = addHours(new Date(), hours);
              setValue("deadline", d.toISOString());
            }}
            categoryId={watch("categoryId") || null}
            mode={deadlineMode}
            onModeChange={setDeadlineMode}
            required
            disabled={!!catalogRule?.enforceFixedTime}
          />
          <FormError message={errors.deadline?.message as string} />
        </div>
      </div>

      {/* Estimated Timeline */}
      <div className="grid grid-cols-1">
        <DateRangePicker
          startDate={watch("estimatedStartDate") || null}
          endDate={watch("estimatedEndDate") || null}
          onStartChange={(date) => setValue("estimatedStartDate", date)}
          onEndChange={(date) => setValue("estimatedEndDate", date)}
          categoryId={watch("categoryId")}
          label="Thời gian dự kiến"
          showSuggestions
        />
      </div>

      {/* Priority Selection */}
      <div>
        <Label required>
          Độ ưu tiên
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue("priority", option.value as any)}
              disabled={isSubmitting}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200",
                "flex flex-col items-center gap-2",
                "hover:shadow-md hover:scale-105",
                selectedPriority === option.value
                  ? "border-primary-500 bg-primary-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <span className="text-2xl">{option.icon}</span>
              <span className="text-sm font-medium text-dark-900">{option.label}</span>
            </button>
          ))}
        </div>
        <FormError message={errors.priority?.message as string} />
      </div>

      {/* Requester Type Toggle */}
      <div>
        <Label>
          Loại người yêu cầu
        </Label>
        <div className="flex items-center gap-4 mt-2">
          <button
            type="button"
            onClick={() => setValue("requesterType", "INTERNAL")}
            disabled={isSubmitting}
            className={cn(
              "flex-1 p-4 rounded-xl border-2 transition-all duration-200",
              "text-center font-medium",
              requesterType === "INTERNAL"
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            )}
          >
            Nội bộ
          </button>
          <button
            type="button"
            onClick={() => setValue("requesterType", "CUSTOMER")}
            disabled={isSubmitting}
            className={cn(
              "flex-1 p-4 rounded-xl border-2 transition-all duration-200",
              "text-center font-medium",
              requesterType === "CUSTOMER"
                ? "border-orange-500 bg-orange-50 text-orange-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            )}
          >
            Khách hàng
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Khách hàng có độ ưu tiên cao hơn khi tính toán tự động
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
        
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {mode === "create" ? "Gửi yêu cầu" : "Cập nhật"}
        </Button>
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
            <p className="text-lg font-medium text-dark-900">Đang xử lý...</p>
          </div>
        </div>
      )}
    </form>
  );
}

