"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Pencil, 
  Users, 
  Trash2,
  Crown,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { deleteTeam } from "@/actions/admin/teams";
import { useRouter } from "next/navigation";

interface Team {
  id: string;
  name: string;
  description: string | null;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  _count: {
    requests: number;
  };
}

interface Props {
  team: Team;
  onEdit: (team: Team) => void;
  onManageMembers: (team: Team) => void;
}

export function TeamCard({ team, onEdit, onManageMembers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`XÓA team "${team.name}"? Hành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteTeam(team.id);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const leader = team.members.find(m => m.role === "LEADER");
  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <Card className="relative hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 mb-2">
              {team.name}
              <Badge variant="outline" className="font-normal">
                {team.members.length} thành viên
              </Badge>
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {team.description || <span className="text-gray-400 italic">Chưa có mô tả</span>}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={loading}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(team)}>
                <Pencil className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageMembers(team)}>
                <Users className="mr-2 h-4 w-4" />
                Quản lý thành viên
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Leader */}
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">Leader:</span>
          <span className="text-sm text-gray-700">
            {leader?.name || <span className="text-gray-400">Chưa có</span>}
          </span>
        </div>

        {/* Members */}
        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Thành viên:</p>
          <div className="flex -space-x-2 overflow-hidden">
            {team.members.slice(0, 5).map((member) => (
              <div
                key={member.id}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white text-xs font-semibold border-2 border-white"
                title={member.name}
              >
                {getInitials(member.name)}
              </div>
            ))}
            {team.members.length > 5 && (
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-400 text-white text-xs font-semibold border-2 border-white">
                +{team.members.length - 5}
              </div>
            )}
            {team.members.length === 0 && (
              <span className="text-sm text-gray-400">Chưa có thành viên</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold text-gray-900">{team._count.requests}</p>
            </div>
            <p className="text-xs text-gray-600">Tổng yêu cầu</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="text-2xl font-bold text-gray-900">{team.members.length}</p>
            </div>
            <p className="text-xs text-gray-600">Thành viên</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onManageMembers(team)}
          >
            <Users className="mr-2 h-4 w-4" />
            Quản lý thành viên
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

