"use client";

import { useRouter } from "next/navigation";
import { 
  Eye, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  activeTasks: number;
  completedThisWeek: number;
  completedThisMonth: number;
  workloadPercent: number;
  lastActiveDate?: Date | string;
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
  team?: {
    id: string;
    name: string;
  } | null;
}

interface TeamTabProps {
  members?: TeamMember[];
  isLoading?: boolean;
}

export function TeamTab({ members = [], isLoading = false }: TeamTabProps) {
  if (isLoading) {
    return <MemberSkeletonGrid />;
  }

  if (!members?.length) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <UserIcon className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Chưa có thành viên trong đội
        </h3>
        <p className="text-gray-600">
          Thêm thành viên để bắt đầu quản lý đội ngũ
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((member) => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  const router = useRouter();

  const getWorkloadColor = (percent: number) => {
    if (percent > 80) return "bg-red-500";
    if (percent > 50) return "bg-orange-500";
    return "bg-green-500";
  };

  const lastActiveText = member.lastActiveDate
    ? formatDistanceToNow(new Date(member.lastActiveDate), {
        addSuffix: true,
        locale: vi,
      })
    : "Chưa có hoạt động";

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* Avatar + Name */}
        <div className="flex items-center gap-3 mb-4">
          <UserAvatar
            user={{
              id: member.id,
              name: member.name,
              gamification: member.gamification || undefined,
            }}
            size={48}
            showLevel
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{member.name}</p>
            <p className="text-sm text-gray-500">{member.email}</p>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              {member.team?.name || "Staff"}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              Đang làm
            </span>
            <span className="font-bold">{member.activeTasks}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Hoàn thành tuần này
            </span>
            <span className="font-bold">{member.completedThisWeek}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-blue-600">
              <TrendingUp className="h-4 w-4" />
              Hoàn thành tháng này
            </span>
            <span className="font-bold">{member.completedThisMonth}</span>
          </div>

          {/* Workload Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Tải công việc</span>
              <span>{member.workloadPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getWorkloadColor(member.workloadPercent)}`}
                style={{ width: `${Math.min(member.workloadPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Action Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => router.push(`/admin/users/${member.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Xem chi tiết
          </Button>
        </div>

        {/* Hoạt động gần đây */}
        <div className="mt-4 text-xs text-gray-500">
          Hoạt động cuối: {lastActiveText}
        </div>
      </CardContent>
    </Card>
  );
}

function MemberSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <Skeleton className="h-8 w-full mt-4" />
              <Skeleton className="h-3 w-32 mt-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
