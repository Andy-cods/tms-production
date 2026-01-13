"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateUser } from "@/actions/admin/users";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Role } from "@prisma/client";
import { ShieldCheck } from "lucide-react";
import { PermissionTicketSelector } from "@/components/admin/permission-ticket-selector";

const formSchema = z.object({
  name: z.string().min(2, "Tên tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional(),
  telegramUsername: z.string().optional(),
  role: z.nativeEnum(Role),
  teamId: z.string().optional(),
  positionText: z.string().optional(),
  permissionTickets: z.array(z.string()).optional(),
});

export function EditUserForm({ user, teams, positions }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      telegramUsername: user.telegramUsername || "",
      role: user.role,
      teamId: user.teamId || undefined,
      positionText: user.positionText || "",
      permissionTickets: user.permissionTickets || [],
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const result = await updateUser(user.id, {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        telegramUsername: data.telegramUsername || null,
        role: data.role as Role,
        teamId: data.teamId || null,
        positionText: data.positionText || null,
        permissionTickets: data.permissionTickets || [],
      });

      if (result.success) {
        toast.success("Cập nhật thành công!");
        router.push("/admin/users");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tên đầy đủ</Label>
            <Input {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label>Số điện thoại</Label>
            <Input placeholder="+84 123 456 789" {...form.register("phone")} />
          </div>

          <div>
            <Label>Telegram Username</Label>
            <Input placeholder="@username" {...form.register("telegramUsername")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vai trò & Vị trí</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Vai trò</Label>
            <Select
              value={form.watch("role")}
              onValueChange={(value) => form.setValue("role", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="LEADER">Leader</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Team</Label>
            <Select
              value={form.watch("teamId") || undefined}
              onValueChange={(value) => form.setValue("teamId", value === "__none__" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Không có team</SelectItem>
                {teams.map((team: any) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Vị trí</Label>
            <Input
              {...form.register("positionText")}
              placeholder="Ví dụ: Senior Developer, Product Manager..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Vị trí công việc của nhân viên (điền tự do)
            </p>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Phân quyền bổ sung
            </Label>
            <PermissionTicketSelector
              selected={form.watch("permissionTickets") || []}
              onChange={(next) => form.setValue("permissionTickets", next, { shouldDirty: true })}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading} className="bg-primary-500">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Hủy
        </Button>
      </div>
    </form>
  );
}

