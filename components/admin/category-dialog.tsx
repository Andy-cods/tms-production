"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createCategory, updateCategory } from "@/actions/admin/categories";
import { useRouter } from "next/navigation";

const categoryFormSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(50, "Tên không quá 50 ký tự"),
  description: z.string().max(200, "Mô tả không quá 200 ký tự").optional(),
  teamId: z.string().nullable(),
  isActive: z.boolean(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface Category {
  id: string;
  name: string;
  description: string | null;
  teamId: string | null;
  isActive: boolean;
}

interface Team {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  category?: Category;
  teams: Team[];
  onSuccess?: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  mode,
  category,
  teams,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      teamId: null,
      isActive: true,
    },
  });

  // Load category data for edit mode
  useEffect(() => {
    if (mode === "edit" && category) {
      setValue("name", category.name);
      setValue("description", category.description || "");
      setValue("teamId", category.teamId);
      setValue("isActive", category.isActive);
    } else if (mode === "create") {
      reset();
    }
  }, [mode, category, setValue, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (mode === "create") {
        await createCategory(data as any);
      } else if (mode === "edit" && category) {
        await updateCategory(category.id, data as any);
      }

      router.refresh();
      onOpenChange(false);
      onSuccess?.();
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tạo phân loại mới" : "Chỉnh sửa phân loại"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên phân loại *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Bug/Lỗi, Feature Request..."
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Input
              id="description"
              {...register("description")}
              placeholder="Mô tả ngắn gọn về phân loại này"
              disabled={loading}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Team */}
          <div className="space-y-2">
            <Label htmlFor="team">Team (tùy chọn)</Label>
            <Select
              value={watch("teamId") || "none"}
              onValueChange={(value) => setValue("teamId", value === "none" ? null : value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tất cả teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Nếu chọn team, chỉ team đó có thể sử dụng phân loại này
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : mode === "create" ? "Tạo" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

