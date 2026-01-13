"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreVertical, Edit, Trash2, Key, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmModal } from "@/components/ui/modal";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";
import { deleteUser as deleteUserAction, changeUserPassword } from "@/actions/admin/users";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  positionText: string | null;
  phone: string | null;
  telegramUsername: string | null;
  isActive: boolean;
  team: { id: string; name: string } | null;
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
  createdAt: Date;
}

interface Team {
  id: string;
  name: string;
}

interface ModernUserTableProps {
  users: User[];
  teams: Team[];
  positions: string[]; // Deprecated, kept for backward compatibility
  initialSearch?: string;
  initialRoleFilter?: string;
  initialStatusFilter?: string;
}

const roleColors = {
  ADMIN: "bg-orange-100 text-orange-700 border-orange-200",
  LEADER: "bg-green-100 text-green-700 border-green-200",
  ASSIGNEE: "bg-blue-100 text-blue-700 border-blue-200",
  STAFF: "bg-blue-100 text-blue-700 border-blue-200", // Alias for ASSIGNEE
  REQUESTER: "bg-gray-100 text-gray-700 border-gray-200",
};

const roleLabels = {
  ADMIN: "Quản trị",
  LEADER: "Trưởng nhóm",
  ASSIGNEE: "Nhân viên",
  STAFF: "Nhân viên", // Alias for ASSIGNEE
  REQUESTER: "Người yêu cầu",
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ModernUserTable({
  users,
  teams,
  positions,
  initialSearch = "",
  initialRoleFilter = "all",
  initialStatusFilter = "all",
}: ModernUserTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [passwordChangeUser, setPasswordChangeUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Filter users client-side
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !search ||
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleChangePassword = async () => {
    if (!passwordChangeUser) return;

    if (!newPassword || newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu không khớp");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changeUserPassword(passwordChangeUser.id, newPassword);
      if (result.success) {
        toast.success(`Đã đặt lại mật khẩu cho ${passwordChangeUser.name || passwordChangeUser.email}`);
        setPasswordChangeUser(null);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đổi mật khẩu");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="grid md:grid-cols-5 gap-4">
          <Input
            placeholder="Tìm kiếm theo tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Vai trò" />
            </SelectTrigger>
              <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="ADMIN">Quản trị</SelectItem>
              <SelectItem value="LEADER">Trưởng nhóm</SelectItem>
              <SelectItem value="ASSIGNEE">Nhân viên</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setRoleFilter("all");
              setStatusFilter("all");
            }}
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">STT</TableHead>
            <TableHead>Người dùng</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Telegram</TableHead>
            <TableHead>Vị trí</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Nhóm</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user, index) => (
            <TableRow key={user.id}>
              <TableCell>
                <span className="font-mono text-sm text-gray-500">
                  {index + 1}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    user={{
                      id: user.id,
                      name: user.name || "Unknown",
                      gamification: user.gamification || null,
                    }}
                    size={40}
                    showLevel
                  />
                  <div>
                    <p className="font-medium text-dark-900">{user.name || "Chưa có tên"}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-gray-600">{user.email}</span>
              </TableCell>
              <TableCell>
                <span className="text-gray-600">
                  {user.phone || (
                    <span className="text-gray-400 italic">-</span>
                  )}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-gray-600">
                  {user.telegramUsername ? (
                    <a 
                      href={`https://t.me/${user.telegramUsername.replace('@', '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      {user.telegramUsername}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">-</span>
                  )}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-gray-600">
                  {user.positionText || (
                    <span className="text-gray-400 italic">Chưa xác định</span>
                  )}
                </span>
              </TableCell>
              <TableCell>
                {user.role ? (
                  <span
                    className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border",
                      roleColors[user.role as keyof typeof roleColors] || "bg-gray-100 text-gray-700 border-gray-200"
                    )}
                  >
                    {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">-</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-gray-600">{user.team?.name || "-"}</span>
              </TableCell>
              <TableCell>
                <Switch
                  checked={user.isActive}
                  onCheckedChange={(checked) => {
                    // TODO: Call toggle user status action
                    console.log("Toggle user status:", user.id, checked);
                  }}
                />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/users/${user.id}`} className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Chỉnh sửa
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-2"
                      onClick={() => setPasswordChangeUser(user)}
                    >
                      <Key className="h-4 w-4" />
                      Đặt lại mật khẩu
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-red-600"
                      onClick={() => setDeleteUser(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          
          {filteredUsers.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Không tìm thấy người dùng</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteUser}
        onClose={() => !isDeleting && setDeleteUser(null)}
        onConfirm={async () => {
          if (!deleteUser) return;
          
          try {
            setIsDeleting(true);
            await deleteUserAction(deleteUser.id);
            setDeleteUser(null);
            router.refresh();
          } catch (error) {
            alert(error instanceof Error ? error.message : "Có lỗi xảy ra khi xóa người dùng");
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Xóa người dùng?"
        description={`Bạn có chắc chắn muốn xóa người dùng "${deleteUser?.name || deleteUser?.email}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        isDestructive
      />

      {/* Change Password Dialog */}
      <Dialog open={!!passwordChangeUser} onOpenChange={(open) => {
        if (!open && !isChangingPassword) {
          setPasswordChangeUser(null);
          setNewPassword("");
          setConfirmPassword("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="user-name">Người dùng</Label>
              <Input
                id="user-name"
                value={passwordChangeUser?.name || passwordChangeUser?.email || ""}
                disabled
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                className="mt-1"
                disabled={isChangingPassword}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="mt-1"
                disabled={isChangingPassword}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPassword && confirmPassword) {
                    handleChangePassword();
                  }
                }}
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-600">Mật khẩu không khớp</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordChangeUser(null);
                setNewPassword("");
                setConfirmPassword("");
              }}
              disabled={isChangingPassword}
            >
              Hủy
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={
                isChangingPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword.length < 6 ||
                newPassword !== confirmPassword
              }
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Đặt lại mật khẩu"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

