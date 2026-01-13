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
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { createUser, updateUser } from "@/actions/admin/users";
import { useRouter } from "next/navigation";

const userFormSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(100, "Tên không quá 100 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").or(z.literal("")).optional(),
  role: z.enum(["ADMIN", "LEADER", "ASSIGNEE"]),
  teamId: z.string().or(z.literal("")).nullable(),
  isActive: z.boolean(),
  phone: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .optional()
    .refine(
      (val) => !val || /^[0-9+\-\s()]*$/.test(val),
      "Số điện thoại không hợp lệ"
    )
    .refine(
      (val) => !val || val.replace(/[^0-9]/g, "").length >= 10,
      "Số điện thoại phải có ít nhất 10 số"
    ),
  telegramUsername: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .optional()
    .refine(
      (val) => !val || /^@?[a-zA-Z0-9_]{5,32}$/.test(val),
      "Telegram username không hợp lệ (5-32 ký tự, chỉ chữ, số, dấu gạch dưới)"
    ),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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
  user?: User;
  teams: Team[];
  onSuccess?: () => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  mode,
  user,
  teams,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "ASSIGNEE",
      teamId: null,
      isActive: true,
      phone: "",
      telegramUsername: "",
    },
  });

  // Load user data for edit mode
  useEffect(() => {
    if (mode === "edit" && user) {
      setValue("name", user.name);
      setValue("email", user.email);
      setValue("role", user.role as any);
      setValue("teamId", user.teamId);
      setValue("isActive", user.isActive);
      setValue("password", ""); // Don't pre-fill password
      setValue("phone", (user as any).phone || "");
      setValue("telegramUsername", (user as any).telegramUsername || "");
    } else if (mode === "create") {
      reset();
    }
  }, [mode, user, setValue, reset]);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue("password", password);
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Prepare data: convert empty strings to null for phone/telegram
      const submitData = {
        ...data,
        phone: data.phone || null,
        telegramUsername: data.telegramUsername || null,
      };

      if (mode === "create") {
        // Password required for create
        if (!submitData.password) {
          setError("Mật khẩu là bắt buộc khi tạo user mới");
          return;
        }
        await createUser(submitData as any);
      } else if (mode === "edit" && user) {
        // Password optional for edit - handled separately if needed
        const updateData: any = {
          name: submitData.name,
          email: submitData.email,
          phone: submitData.phone,
          telegramUsername: submitData.telegramUsername,
          role: submitData.role,
          teamId: submitData.teamId,
        };
        const result = await updateUser(user.id, updateData);
        if (!result.success) {
          setError(result.error || "Có lỗi xảy ra khi cập nhật");
          return;
        }
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
            {mode === "create" ? "Tạo người dùng mới" : "Chỉnh sửa người dùng"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Nguyễn Văn A"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="user@example.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              {mode === "create" ? "Mật khẩu *" : "Mật khẩu (để trống nếu không đổi)"}
            </Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder={mode === "create" ? "Nhập mật khẩu" : "Để trống nếu không đổi"}
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              {mode === "create" && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generatePassword}
                  disabled={loading}
                  title="Tạo mật khẩu ngẫu nhiên"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              {...register("phone")}
              placeholder="+84 123 456 789"
              disabled={loading}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
            <p className="text-xs text-gray-500">Số điện thoại liên hệ (tùy chọn)</p>
          </div>

          {/* Telegram Username */}
          <div className="space-y-2">
            <Label htmlFor="telegramUsername">Telegram</Label>
            <Input
              id="telegramUsername"
              type="text"
              {...register("telegramUsername")}
              placeholder="@username"
              disabled={loading}
            />
            {errors.telegramUsername && (
              <p className="text-sm text-red-600">{errors.telegramUsername.message}</p>
            )}
            <p className="text-xs text-gray-500">Telegram username (5-32 ký tự, tùy chọn)</p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Vai trò *</Label>
            <Select
              value={watch("role")}
              onValueChange={(value: any) => setValue("role", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ASSIGNEE">Nhân viên</SelectItem>
                <SelectItem value="LEADER">Trưởng nhóm</SelectItem>
                <SelectItem value="ADMIN">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
            )}
            {watch("role") === "ADMIN" && (
              <p className="text-xs text-amber-600">
                ⚠️ Vai trò Admin có toàn quyền truy cập hệ thống
              </p>
            )}
          </div>

          {/* Team */}
          <div className="space-y-2">
            <Label htmlFor="team">Team</Label>
            <Select
              value={watch("teamId") || "none"}
              onValueChange={(value) => setValue("teamId", value === "none" ? null : value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không thuộc team nào</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

