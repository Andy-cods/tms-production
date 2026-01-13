// @ts-nocheck
import { PrismaClient, AchievementCategory } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedAchievements() {
  console.log("🌱 Seeding achievements...");

  const achievements = [
    {
      code: "FIRST_TASK",
      name: "First Blood",
      description: "Hoàn thành công việc đầu tiên",
      icon: "🎯",
      category: AchievementCategory.MILESTONE,
      requirement: 1,
    },
    {
      code: "TASKS_10",
      name: "Getting Started",
      description: "Hoàn thành 10 công việc",
      icon: "⭐",
      category: AchievementCategory.MILESTONE,
      requirement: 10,
    },
    {
      code: "TASKS_50",
      name: "Half Century",
      description: "Hoàn thành 50 công việc",
      icon: "🌟",
      category: AchievementCategory.MILESTONE,
      requirement: 50,
    },
    {
      code: "TASKS_100",
      name: "Century",
      description: "Hoàn thành 100 công việc",
      icon: "💯",
      category: AchievementCategory.MILESTONE,
      requirement: 100,
    },
    {
      code: "STREAK_7",
      name: "Streak Master",
      description: "Duy trì streak 7 ngày liên tiếp",
      icon: "🔥",
      category: AchievementCategory.STREAK,
      requirement: 7,
    },
    {
      code: "STREAK_30",
      name: "On Fire",
      description: "Duy trì streak 30 ngày liên tiếp",
      icon: "🔥🔥",
      category: AchievementCategory.STREAK,
      requirement: 30,
    },
    {
      code: "SLA_95",
      name: "Quality Champion",
      description: "Đạt 95% SLA compliance",
      icon: "🏆",
      category: AchievementCategory.QUALITY,
      requirement: 95,
    },
    {
      code: "PERFECT_WEEK",
      name: "Perfect Week",
      description: "Hoàn thành 100% tasks đúng hạn trong 1 tuần",
      icon: "✨",
      category: AchievementCategory.PERFECT_WEEK,
      requirement: 1,
    },
    {
      code: "SPEED_5",
      name: "Speed Demon",
      description: "Hoàn thành 5 công việc trong 1 ngày",
      icon: "⚡",
      category: AchievementCategory.SPEED,
      requirement: 5,
    },
    {
      code: "TIME_TRACKER",
      name: "Time Master",
      description: "Track thời gian cho 50 công việc",
      icon: "⏱️",
      category: AchievementCategory.TIME_MASTER,
      requirement: 50,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: {},
      create: achievement,
    });
  }

  console.log(`✅ ${achievements.length} achievements created`);

  console.log("✅ Achievements seeding complete");
}

