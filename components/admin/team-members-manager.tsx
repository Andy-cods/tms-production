"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserMinus, UserPlus } from "lucide-react";
import { addMembersToTeam, removeMemberFromTeam } from "@/actions/admin/teams";
import { useRouter } from "next/navigation";

interface Team {
  id: string;
  name: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  allUsers: User[];
}

export function TeamMembersManager({ open, onOpenChange, team, allUsers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  if (!team) return null;

  const availableUsers = allUsers.filter(
    (user) => !team.members.some((m) => m.id === user.id) && !user.teamId
  );

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setLoading(true);
      await addMembersToTeam(team.id, selectedUsers);
      setSelectedUsers([]);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Xóa ${userName} khỏi team ${team.name}?`)) return;

    try {
      setLoading(true);
      await removeMemberFromTeam(team.id, userId, true);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quản lý thành viên - {team.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Members */}
          <div>
            <h3 className="text-sm font-semibold mb-3">
              Thành viên hiện tại ({team.members.length})
            </h3>
            {team.members.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Tên</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-600">{member.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            disabled={loading}
                          >
                            <UserMinus className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Chưa có thành viên</p>
            )}
          </div>

          {/* Add Members */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                Thêm thành viên ({availableUsers.length} có sẵn)
              </h3>
              {selectedUsers.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleAddMembers}
                  disabled={loading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Thêm {selectedUsers.length} người
                </Button>
              )}
            </div>

            {availableUsers.length > 0 ? (
              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[50px]">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === availableUsers.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(availableUsers.map((u) => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead>Vai trò</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded border">
                Không có user nào khả dụng
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

