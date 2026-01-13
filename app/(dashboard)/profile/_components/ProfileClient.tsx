"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarCustomizer } from "@/components/gamification/avatar-customizer";
import { Pet } from "@/components/gamification/pet";
import { PetAdoptionDialog } from "@/components/gamification/pet-adoption-dialog";
import { PetDisplay } from "@/components/gamification/pet-display";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ProfileClient({ user }: any) {
  const router = useRouter();
  const [petDialogOpen, setPetDialogOpen] = useState(false);
  const stats = user.stats;

  if (!stats) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">Đang tải thống kê...</p>
      </div>
    );
  }

  // Get avatar from stats or use defaults
  const currentAvatar = stats ? {
    skin: stats.avatarSkin || "default",
    hair: stats.avatarHair || "short",
    hairColor: stats.avatarHairColor || "black",
    eyes: stats.avatarEyes || "normal",
    mouth: stats.avatarMouth || "smile",
    accessory: stats.avatarAccessory || null,
    background: stats.avatarBackground || "blue",
  } : {
    skin: "default",
    hair: "short",
    hairColor: "black",
    eyes: "normal",
    mouth: "smile",
    accessory: null,
    background: "blue",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size={100} showLevel />
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Level {stats.level} • {stats.experiencePoints} XP
            </p>
          </div>
        </div>

        <Tabs defaultValue="avatar" className="w-full">
          <TabsList>
            <TabsTrigger value="avatar">🎨 Avatar</TabsTrigger>
            <TabsTrigger value="pet">🐾 Pet</TabsTrigger>
            <TabsTrigger value="stats">📊 Thống kê</TabsTrigger>
            <TabsTrigger value="account">⚙️ Tài khoản</TabsTrigger>
          </TabsList>

          {/* Avatar Tab */}
          <TabsContent value="avatar">
            <Card>
              <CardHeader>
                <CardTitle>Tùy chỉnh Avatar</CardTitle>
              </CardHeader>
              <CardContent>
                <AvatarCustomizer currentAvatar={currentAvatar} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pet Tab */}
          <TabsContent value="pet">
            <Card>
              <CardHeader>
                <CardTitle>Thú cưng của bạn</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.petType ? (
                  <PetDisplay />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">
                      Bạn chưa có thú cưng
                    </p>
                    <Button
                      className="bg-primary-500 hover:bg-primary-600 text-white"
                      onClick={() => setPetDialogOpen(true)}
                    >
                      Nhận nuôi thú cưng
                    </Button>
                    <PetAdoptionDialog
                      open={petDialogOpen}
                      onOpenChange={setPetDialogOpen}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Thống kê</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <StatCard
                    label="Hoàn thành"
                    value={stats.totalTasksCompleted}
                    icon="✅"
                  />
                  <StatCard
                    label="Đúng hạn"
                    value={stats.onTimeCompletions}
                    icon="⏰"
                  />
                  <StatCard
                    label="Streak hiện tại"
                    value={stats.currentStreak}
                    icon="🔥"
                  />
                  <StatCard
                    label="Streak dài nhất"
                    value={stats.longestStreak}
                    icon="🏆"
                  />
                </div>

                <div className="mt-8">
                  <h3 className="font-semibold mb-4">SLA Compliance</h3>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-3xl font-bold text-primary-600">
                      {stats.slaCompliantCount + stats.slaViolationCount > 0
                        ? Math.round(
                            (stats.slaCompliantCount /
                              (stats.slaCompliantCount +
                                stats.slaViolationCount)) *
                              100
                          )
                        : 0}
                      %
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {stats.slaCompliantCount} /{" "}
                      {stats.slaCompliantCount + stats.slaViolationCount} tasks
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push("/achievements")}
                >
                  Xem tất cả thành tích →
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin tài khoản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Họ tên" value={user.name} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Vai trò" value={user.role} />
                <InfoRow label="Team" value={user.team?.name || "Chưa có"} />

                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline">Đổi mật khẩu</Button>
                  <Button variant="outline">Cài đặt</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

