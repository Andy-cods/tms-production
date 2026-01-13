"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, UserCog, Users, Lock, Pause, Play, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  toggleUserStatus,
  deleteUser,
  changeUserRole,
  assignUserTeam,
} from "@/actions/admin/users";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/shared/user-avatar";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
  team?: { id: string; name: string } | null;
  gamification?: {
    avatarSkin: string;
    avatarHair: string;
    avatarHairColor: string;
    avatarEyes: string;
    avatarMouth: string;
    avatarAccessory: string | null;
    avatarBackground: string;
    level?: number;
  } | null;
  isActive: boolean;
  createdAt: Date;
}

interface Props {
  users: User[];
  onEditUser: (user: User) => void;
}

const ROLE_CONFIG = {
  ADMIN: { label: "Admin", color: "bg-red-100 text-red-800 border-red-200" },
  LEADER: { label: "Leader", color: "bg-blue-100 text-blue-800 border-blue-200" },
  ASSIGNEE: { label: "Assignee", color: "bg-green-100 text-green-800 border-green-200" },
  REQUESTER: { label: "Requester", color: "bg-gray-100 text-gray-800 border-gray-200" },
};

export function UserTable({ users, onEditUser }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggleStatus = async (userId: string) => {
    if (!confirm("Xác nhận thay đổi trạng thái user?")) return;

    try {
      setLoading(userId);
      await toggleUserStatus(userId);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`XÓA user "${userName}"? Hành động này không thể hoàn tác!`)) return;

    try {
      setLoading(userId);
      await deleteUser(userId);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setLoading(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n, index) => ({ char: n[0], index }))
      .map(({ char }) => char)
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (role: string) => {
    const colors = {
      ADMIN: "bg-red-500",
      LEADER: "bg-blue-500",
      ASSIGNEE: "bg-green-500",
      REQUESTER: "bg-gray-500",
    };
    return colors[role as keyof typeof colors] || "bg-gray-400";
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border">
        <p className="text-gray-600">Chưa có người dùng nào</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-[60px]">Avatar</TableHead>
            <TableHead>Tên & Email</TableHead>
            <TableHead className="w-[120px]">Vai trò</TableHead>
            <TableHead className="w-[150px]">Team</TableHead>
            <TableHead className="w-[120px]">Trạng thái</TableHead>
            <TableHead className="w-[130px]">Ngày tạo</TableHead>
            <TableHead className="w-[80px] text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const roleConfig = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG];
            const isLoading = loading === user.id;

            return (
              <TableRow key={user.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar 
                      user={{
                        id: user.id,
                        name: user.name,
                        gamification: user.gamification || null,
                      }}
                      size={40}
                      showLevel
                    />
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={roleConfig.color}>
                    {roleConfig.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.team ? (
                    <span className="text-sm text-gray-900">{user.team.name}</span>
                  ) : (
                    <span className="text-sm text-gray-400">Chưa có team</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      user.isActive
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }
                  >
                    {user.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {format(user.createdAt, "dd/MM/yyyy", { locale: vi })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isLoading}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/${user.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>
                        {user.isActive ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Vô hiệu hóa
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Kích hoạt
                          </>
                        )}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => handleDelete(user.id, user.name)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

