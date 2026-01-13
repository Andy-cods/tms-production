"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Lock, Trophy, Award, Sparkles } from "lucide-react";

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  currentValue: number;
  createdAt: string;
}

interface AchievementsClientProps {
  groupedAchievements: {
    MILESTONE: Achievement[];
    STREAK: Achievement[];
    QUALITY: Achievement[];
    PERFECT_WEEK: Achievement[];
  };
  stats: {
    total: number;
    unlocked: number;
    completionRate: number;
  };
}

export function AchievementsClient({ groupedAchievements, stats }: AchievementsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const allAchievements = Object.values(groupedAchievements).flat();

  const getFilteredAchievements = (category: string) => {
    if (category === "all") return allAchievements;
    return groupedAchievements[category as keyof typeof groupedAchievements] || [];
  };

  const filteredAchievements = getFilteredAchievements(selectedCategory);

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng thành tích</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="relative">
                <Trophy className="h-10 w-10 text-yellow-500" />
                <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã mở khóa</p>
                <p className="text-3xl font-bold text-green-600">{stats.unlocked}</p>
              </div>
              <Award className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Tiến độ</p>
                <p className="text-sm font-medium">{stats.completionRate}%</p>
              </div>
              <Progress value={stats.completionRate} className="h-3" />
              <p className="text-xs text-gray-500 mt-1">
                {stats.unlocked}/{stats.total} thành tích
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs - FIX: Dùng onValueChange thay vì onClick */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            <span className="flex items-center gap-1">🌟 Tất cả</span>
          </TabsTrigger>
          <TabsTrigger value="MILESTONE">
            <span className="flex items-center gap-1">🎯 Cột mốc</span>
          </TabsTrigger>
          <TabsTrigger value="STREAK">
            <span className="flex items-center gap-1">🔥 Streak</span>
          </TabsTrigger>
          <TabsTrigger value="QUALITY">
            <span className="flex items-center gap-1">⭐ Chất lượng</span>
          </TabsTrigger>
          <TabsTrigger value="PERFECT_WEEK">
            <span className="flex items-center gap-1">✨ Hoàn hảo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {filteredAchievements.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Không có thành tích nào trong danh mục này</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Achievement Card Component với special emojis
function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isLocked = !achievement.unlocked;

  const getSpecialEffect = (code: string) => {
    if (code === "TASKS_500") return "👑✨💎";
    if (code === "STREAK_100") return "💎🔥⚡";
    if (code === "STREAK_30") return "⭐🌟✨";
    if (code === "PERFECT_WEEK") return "✨🎉🏆";
    if (code === "TASKS_100") return "🏆🎯💪";
    return "";
  };

  const specialEffect = getSpecialEffect(achievement.code);

  return (
    <Card
      className={`relative transition-all duration-300 transform hover:scale-105 ${
        isLocked
          ? "bg-gray-50 border-2 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
          : "bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 border-2 border-yellow-300 hover:shadow-2xl hover:border-yellow-400"
      }`}
    >
      <CardContent className="pt-6 pb-6">
        {isLocked && (
          <div className="absolute top-4 right-4">
            <div className="relative">
              <Lock className="h-7 w-7 text-gray-400" />
              <div className="absolute inset-0 bg-gray-400 blur-sm opacity-30 rounded-full"></div>
            </div>
          </div>
        )}

        {!isLocked && (
          <div className="absolute top-2 right-2">
            <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
          </div>
        )}

        {/* Icon with Special Effects */}
        <div className="flex justify-center mb-4">
          <div className={`text-7xl transition-all duration-500 ${isLocked ? "grayscale opacity-30 blur-sm" : "animate-bounce-slow"}`}>
            {achievement.icon}
          </div>
        </div>

        {!isLocked && specialEffect && (
          <div className="text-center mb-2">
            <span className="text-2xl animate-pulse">{specialEffect}</span>
          </div>
        )}

        {/* Name & Description */}
        <div className="text-center mb-4">
          <h3 className={`font-bold text-xl mb-2 ${isLocked ? "text-gray-500" : "text-gray-900"}`}>
            {isLocked ? "🔒 ???" : achievement.name}
          </h3>
          <p className={`text-sm leading-relaxed ${isLocked ? "text-gray-400 italic" : "text-gray-700 font-medium"}`}>
            {isLocked ? "Bí mật... Hoàn thành để khám phá!" : achievement.description}
          </p>
        </div>

        {/* Requirement Badge */}
        <div className="flex justify-center mb-4">
          <Badge
            variant={isLocked ? "secondary" : "default"}
            className={`text-sm px-3 py-1 ${isLocked ? "bg-gray-200 text-gray-700" : "bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold shadow-lg"}`}
          >
            {achievement.requirement}{" "}
            {achievement.category === "MILESTONE" && "tasks"}
            {achievement.category === "STREAK" && "ngày"}
            {achievement.category === "QUALITY" && "%"}
            {achievement.category === "PERFECT_WEEK" && "%"}
          </Badge>
        </div>

        {isLocked && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Tiến độ</span>
              <span className="text-xs font-bold text-gray-700">
                {achievement.currentValue} / {achievement.requirement}
              </span>
            </div>
            <Progress value={achievement.progress} className="h-3 bg-gray-200" />
            <p className="text-xs text-gray-500 text-center font-medium">
              {Math.round(achievement.progress)}% hoàn thành
            </p>
          </div>
        )}

        {!isLocked && achievement.unlockedAt && (
          <div className="text-center bg-green-100 rounded-lg py-2 px-3 border border-green-300">
            <p className="text-xs text-green-700 font-medium">
              🎉 Mở khóa {formatDistanceToNow(new Date(achievement.unlockedAt), { addSuffix: true, locale: vi })}
            </p>
          </div>
        )}

        {/* Category Tag */}
        <div className="flex justify-center mt-4">
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${isLocked ? "bg-gray-200 text-gray-600" : "bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 border border-purple-300"}`}
          >
            {getCategoryLabel(achievement.category)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    MILESTONE: "🎯 Cột mốc",
    STREAK: "🔥 Streak",
    QUALITY: "⭐ Chất lượng",
    PERFECT_WEEK: "✨ Hoàn hảo",
    SPEED: "⚡ Tốc độ",
    TIME_MASTER: "⏰ Quản lý thời gian",
  };
  return labels[category] || category;
}


