"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { UserTable } from "@/components/admin/user-table";
import { UserFormDialog } from "@/components/admin/user-form-dialog";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
  team?: { id: string; name: string } | null;
  isActive: boolean;
  createdAt: Date;
}

interface Team {
  id: string;
  name: string;
}

interface Props {
  users: User[];
  teams: Team[];
  initialSearch: string;
  initialRoleFilter: string;
  initialStatusFilter: string;
}

export function UserManagementClient({
  users,
  teams,
  initialSearch,
  initialRoleFilter,
  initialStatusFilter,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<User | undefined>();

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateFilters("q", value);
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    updateFilters("role", value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    updateFilters("status", value);
  };

  const handleCreateUser = () => {
    setDialogMode("create");
    setSelectedUser(undefined);
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setDialogMode("edit");
    setSelectedUser(user);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Quản lý người dùng hệ thống</p>
        </div>
        <Button onClick={handleCreateUser}>
          <UserPlus className="mr-2 h-4 w-4" />
          Tạo người dùng
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={roleFilter} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tất cả vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="LEADER">Leader</SelectItem>
              <SelectItem value="ASSIGNEE">Nhân viên</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="inactive">Đã vô hiệu hóa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* User count */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">{users.length}</span> người dùng
      </div>

      {/* User table */}
      <div className="bg-white border rounded-lg">
        <UserTable users={users} onEditUser={handleEditUser} />
      </div>

      {/* User form dialog */}
      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        user={selectedUser}
        teams={teams}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}

