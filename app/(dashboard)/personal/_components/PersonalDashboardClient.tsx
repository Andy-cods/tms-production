"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  TrendingUp,
  Flame,
  Calendar,
  Clock,
  Award,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  Activity,
  Zap,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TodoList } from "./TodoList";

interface PersonalDashboardClientProps {
  dashboard: any;
  userId: string;
}

export function PersonalDashboardClient({
  dashboard,
  userId,
}: PersonalDashboardClientProps) {
  const router = useRouter();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const {
    todaysFocus,
    weekProgress,
    weekComparison,
    userStats,
    upcomingDeadlines,
    quickStats,
    recentAchievements,
  } = dashboard;

  // Calculate completion percentage
  const weekCompletionPercent =
    weekProgress.total > 0
      ? Math.round((weekProgress.done / weekProgress.total) * 100)
      : 0;

  // Format time tracked
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // SLA compliance rate
  const slaRate =
    userStats.slaCompliantCount + userStats.slaViolationCount > 0
      ? Math.round(
          (userStats.slaCompliantCount /
            (userStats.slaCompliantCount + userStats.slaViolationCount)) *
            100
        )
      : 0;

  // On-time rate
  const onTimeRate =
    userStats.totalTasksCompleted > 0
      ? Math.round(
          (userStats.onTimeCompletions / userStats.totalTasksCompleted) * 100
        )
      : 0;

  // Handle recalculate
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const response = await fetch("/api/stats/recalculate", {
        method: "POST",
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error recalculating:", error);
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section with Sync Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard cá nhân
          </h1>
          <p className="text-gray-600">
            Tổng quan công việc và hiệu suất của bạn
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isRecalculating && "animate-spin")} />
          {isRecalculating ? "Đang tính..." : "Đồng bộ stats"}
        </Button>
      </div>

      {/* Quick Stats Row - Redesigned */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <Card variant="hoverable" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary-50 rounded-bl-full opacity-50" />
          <CardContent className="pt-6 relative">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Tổng tasks</p>
                <p className="text-3xl font-bold text-gray-900">
                  {quickStats.totalTasks}
                </p>
                <p className="text-xs text-gray-500">Tất cả nhiệm vụ</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Tasks */}
        <Card variant="hoverable" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full opacity-50" />
          <CardContent className="pt-6 relative">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Đang làm</p>
                <p className="text-3xl font-bold text-blue-600">
                  {quickStats.activeTasks}
                </p>
                <p className="text-xs text-gray-500">Đang thực hiện</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed Today */}
        <Card variant="hoverable" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full opacity-50" />
          <CardContent className="pt-6 relative">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Hoàn thành hôm nay</p>
                <p className="text-3xl font-bold text-green-600">
                  {quickStats.completedToday}
                </p>
                <p className="text-xs text-gray-500">Tasks đã xong</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Tracked */}
        <Card variant="hoverable" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full opacity-50" />
          <CardContent className="pt-6 relative">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Thời gian hôm nay</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatTime(quickStats.timeTrackedToday)}
                </p>
                <p className="text-xs text-gray-500">Đã theo dõi</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Timer className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Todo List - Notion Style */}
      <TodoList userId={userId} />

      {/* Main Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Focus Widget */}
        <Card variant="hoverable" className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Target className="h-5 w-5 text-primary-600" />
              </div>
              Nhiệm vụ hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysFocus.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="text-5xl">😴</div>
                <p className="text-sm text-gray-500 font-medium">
                  Không có task nào cần làm ngay!
                </p>
                <p className="text-xs text-gray-400">
                  Tận hưởng thời gian nghỉ ngơi
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysFocus.map((task: any) => (
                  <div
                    key={task.id}
                    className="group p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
                    onClick={() => router.push(`/requests/${task.request?.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 flex-1">
                        {task.title}
                      </h4>
                      <Badge
                        variant={
                          task.request?.priority === "URGENT"
                            ? "destructive"
                            : task.request?.priority === "HIGH"
                            ? "default"
                            : "secondary"
                        }
                        className="ml-2 shrink-0"
                      >
                        {task.request?.priority}
                      </Badge>
                    </div>
                    {task.deadline && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(task.deadline), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Progress Widget */}
        <Card variant="hoverable" className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              Tiến độ tuần này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Hoàn thành</span>
                  <span className="text-lg font-bold text-gray-900">
                    {weekProgress.done}/{weekProgress.total}
                  </span>
                </div>
                <Progress 
                  value={weekCompletionPercent} 
                  className="h-3 bg-gray-100"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {weekCompletionPercent}% hoàn thành
                  </span>
                  {weekComparison !== 0 && (
                    <div className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      weekComparison > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {weekComparison > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      <span>
                        {Math.abs(weekComparison)}% so với tuần trước
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 mb-1">Cần làm</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {weekProgress.todo}
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-medium text-blue-600 mb-1">Đang làm</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {weekProgress.inProgress}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs font-medium text-green-600 mb-1">Xong</p>
                  <p className="text-2xl font-bold text-green-600">
                    {weekProgress.done}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak Widget */}
        <Card variant="hoverable" className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-6">
              {/* Current Streak */}
              <div className="space-y-2">
                <div className="text-7xl mb-3">
                  {userStats.currentStreak > 0 ? "🔥" : "😴"}
                </div>
                <div>
                  <p className="text-5xl font-bold text-orange-600">
                    {userStats.currentStreak}
                  </p>
                  <p className="text-sm font-medium text-gray-600 mt-1">
                    ngày liên tiếp
                  </p>
                </div>
              </div>

              {/* Best Streak */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1">Kỷ lục</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userStats.longestStreak} ngày
                </p>
              </div>

              {/* Motivational Message */}
              <div className="pt-2">
                <p className="text-xs font-medium text-gray-600 italic">
                  {userStats.currentStreak === 0 && "Bắt đầu streak mới hôm nay! 🚀"}
                  {userStats.currentStreak > 0 &&
                    userStats.currentStreak < 7 &&
                    "Cố gắng giữ vững phong độ! 💪"}
                  {userStats.currentStreak >= 7 &&
                    userStats.currentStreak < 30 &&
                    "Tuyệt vời! Tiếp tục phát huy! ⭐"}
                  {userStats.currentStreak >= 30 && "Bạn là huyền thoại! 👑"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance & Achievements Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card variant="hoverable">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              Hiệu suất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* SLA Compliance */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">SLA Compliance</span>
                  <span className="text-lg font-bold text-gray-900">{slaRate}%</span>
                </div>
                <Progress 
                  value={slaRate} 
                  className="h-2.5 bg-gray-100"
                />
              </div>

              {/* On-time Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Đúng hạn</span>
                  <span className="text-lg font-bold text-gray-900">{onTimeRate}%</span>
                </div>
                <Progress 
                  value={onTimeRate} 
                  className="h-2.5 bg-gray-100"
                />
              </div>

              {/* Avg Completion Time */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Thời gian hoàn thành TB
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {userStats.avgCompletionDays.toFixed(1)} ngày
                  </span>
                </div>
              </div>

              {/* Level & XP */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-semibold text-gray-900">
                      Level {userStats.level}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {userStats.experiencePoints} XP
                  </span>
                </div>
                <Progress
                  value={(userStats.experiencePoints % 100)}
                  className="h-3 bg-gray-100"
                />
                <p className="text-xs text-gray-500 text-center">
                  {100 - (userStats.experiencePoints % 100)} XP đến level tiếp theo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card variant="hoverable">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              Thành tích
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAchievements.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="text-5xl">🏆</div>
                <p className="text-sm font-medium text-gray-600">
                  Hoàn thành tasks để mở khóa thành tích!
                </p>
                <p className="text-xs text-gray-400">
                  Mỗi thành tích là một cột mốc đáng nhớ
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAchievements.map((ua: any) => (
                  <div
                    key={ua.id}
                    className="group flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-yellow-300 hover:shadow-md transition-all duration-200 bg-white"
                  >
                    <div className="text-4xl shrink-0">{ua.achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 mb-1">
                        {ua.achievement.name}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {ua.achievement.description}
                      </p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="shrink-0 text-xs"
                    >
                      {formatDistanceToNow(new Date(ua.unlockedAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full mt-6 gap-2"
              onClick={() => router.push("/achievements")}
            >
              <Award className="h-4 w-4" />
              Xem tất cả thành tích
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <Card variant="hoverable">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-red-100 rounded-lg">
              <Calendar className="h-5 w-5 text-red-600" />
            </div>
            Deadline sắp tới (7 ngày)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingDeadlines.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-5xl">📅</div>
              <p className="text-sm font-medium text-gray-600">
                Không có deadline nào trong 7 ngày tới
              </p>
              <p className="text-xs text-gray-400">
                Bạn đang kiểm soát tốt thời gian!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((task: any) => (
                <div
                  key={task.id}
                  className="group flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-red-300 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
                  onClick={() => router.push(`/requests/${task.request?.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1 group-hover:text-red-600 transition-colors">
                      {task.title}
                    </h4>
                    <p className="text-xs text-gray-600 truncate">
                      {task.request?.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatDistanceToNow(new Date(task.deadline), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        task.request?.priority === "URGENT"
                          ? "destructive"
                          : task.request?.priority === "HIGH"
                          ? "default"
                          : "secondary"
                      }
                      className="shrink-0"
                    >
                      {task.request?.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
