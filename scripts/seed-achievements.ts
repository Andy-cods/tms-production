import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding achievements...\n");

  const achievements = [
    // Milestones
    {
      code: "TASKS_10",
      name: "Khởi đầu",
      description: "Hoàn thành 10 tasks",
      icon: "🎯",
      category: "MILESTONE",
      requirement: 10,
    },
    {
      code: "TASKS_50",
      name: "Chuyên nghiệp",
      description: "Hoàn thành 50 tasks",
      icon: "💼",
      category: "MILESTONE",
      requirement: 50,
    },
    {
      code: "TASKS_100",
      name: "Bậc thầy",
      description: "Hoàn thành 100 tasks",
      icon: "🏆",
      category: "MILESTONE",
      requirement: 100,
    },
    {
      code: "TASKS_500",
      name: "Huyền thoại",
      description: "Hoàn thành 500 tasks",
      icon: "👑",
      category: "MILESTONE",
      requirement: 500,
    },

    // Streaks
    {
      code: "STREAK_7",
      name: "Tuần hoàn hảo",
      description: "7 ngày liên tiếp hoàn thành đúng hạn",
      icon: "🔥",
      category: "STREAK",
      requirement: 7,
    },
    {
      code: "STREAK_30",
      name: "Tháng vàng",
      description: "30 ngày liên tiếp hoàn thành đúng hạn",
      icon: "⭐",
      category: "STREAK",
      requirement: 30,
    },
    {
      code: "STREAK_100",
      name: "Bất khả chiến bại",
      description: "100 ngày liên tiếp hoàn thành đúng hạn",
      icon: "💎",
      category: "STREAK",
      requirement: 100,
    },

    // Quality
    {
      code: "SLA_95",
      name: "Đúng giờ",
      description: "SLA compliance ≥95%",
      icon: "⏰",
      category: "QUALITY",
      requirement: 95,
    },
    {
      code: "PERFECT_WEEK",
      name: "Tuần hoàn mỹ",
      description: "Hoàn thành 100% tasks trong tuần",
      icon: "✨",
      category: "PERFECT_WEEK",
      requirement: 100,
    },
  ];

  let count = 0;

  for (const achievement of achievements) {
    try {
      await prisma.achievement.upsert({
        where: { code: achievement.code },
        create: achievement as any,
        update: achievement as any,
      });
      console.log(`  ✅ ${achievement.icon} ${achievement.name}`);
      count++;
    } catch (error) {
      console.error(`  ❌ Failed: ${achievement.name}`, error);
    }
  }

  console.log(`\n✨ Successfully seeded ${count}/${achievements.length} achievements!\n`);
}

main()
  .catch((e) => {
    console.error("\n❌ Error seeding achievements:", (e as any)?.message);
    console.error("\nStack trace:", (e as any)?.stack);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
