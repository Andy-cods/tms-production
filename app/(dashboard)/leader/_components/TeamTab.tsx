"use client";

import Link from "next/link";
import { Eye, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  _count: {
    assignedTasks: number;
  };
}

interface TeamTabProps {
  members: TeamMember[];
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getWorkloadColor(taskCount: number): string {
  if (taskCount === 0) return "bg-gray-200";
  if (taskCount <= 3) return "bg-green-500";
  if (taskCount <= 6) return "bg-orange-500";
  return "bg-red-500";
}

function getWorkloadLabel(taskCount: number): string {
  if (taskCount === 0) return "Trống";
  if (taskCount <= 3) return "Bình thường";
  if (taskCount <= 6) return "Cao";
  return "Quá tải";
}

export function TeamTab({ members }: TeamTabProps) {
  if (members.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-full bg-gray-100 mb-4">
            <User className="h-16 w-16 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-dark-900 mb-2">
            Chưa có thành viên
          </h3>
          <p className="text-gray-600">
            Nhóm của bạn chưa có thành viên nào
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {members.map((member) => {
        const taskCount = member._count.assignedTasks;
        const workloadColor = getWorkloadColor(taskCount);
        const workloadLabel = getWorkloadLabel(taskCount);

        return (
          <div
            key={member.id}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
          >
            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-lg flex-shrink-0">
                {getInitials(member.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {member.name || member.email}
                </h3>
                <p className="text-sm text-gray-600">
                  {member.email}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Đang làm</span>
                <span className="font-semibold text-gray-900">{taskCount}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Hoàn thành tuần này</span>
                <span className="font-semibold text-green-600">0</span>
              </div>

              {/* Workload Bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Tải công việc</span>
                  <span className="font-medium">{Math.min((taskCount / 10) * 100, 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", workloadColor)}
                    style={{ width: `${Math.min((taskCount / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action */}
            <Link href={`/leader/team?member=${member.id}`}>
              <Button variant="ghost" size="sm" className="w-full">
                Xem chi tiết
              </Button>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

