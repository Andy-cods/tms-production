import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creating test tasks for Personal Dashboard...\n");

  // Get first user
  const user = await prisma.user.findFirst({
    where: {
      role: { in: ["ASSIGNEE", "LEADER"] },
    },
  });

  if (!user) {
    console.log("❌ No user found. Please create a user first.");
    return;
  }

  console.log(`Creating tasks for user: ${user.name} (${user.email})`);

  // Get first request or create one
  let request = await prisma.request.findFirst();

  if (!request) {
    const category = await prisma.category.findFirst();
    
    if (!category) {
      console.log("❌ No category found. Please create a category first.");
      return;
    }

    request = await prisma.request.create({
      data: {
        title: "Test Request for Stats",
        description: "Request để test personal dashboard",
        priority: "MEDIUM",
        status: "OPEN",
        requesterId: user.id,
        categoryId: category.id,
      },
    });
  }

  // Create 10 completed tasks (8 on-time, 2 late)
  const tasks = [
    { title: "Task 1 - On time", onTime: true, daysAgo: 10 },
    { title: "Task 2 - On time", onTime: true, daysAgo: 9 },
    { title: "Task 3 - On time", onTime: true, daysAgo: 8 },
    { title: "Task 4 - Late", onTime: false, daysAgo: 7 },
    { title: "Task 5 - On time", onTime: true, daysAgo: 6 },
    { title: "Task 6 - On time", onTime: true, daysAgo: 5 },
    { title: "Task 7 - On time", onTime: true, daysAgo: 4 },
    { title: "Task 8 - Late", onTime: false, daysAgo: 3 },
    { title: "Task 9 - On time", onTime: true, daysAgo: 2 },
    { title: "Task 10 - On time", onTime: true, daysAgo: 1 },
  ];

  for (const taskData of tasks) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - taskData.daysAgo - 2);

    const deadline = new Date();
    deadline.setDate(deadline.getDate() - taskData.daysAgo);

    const completedAt = new Date();
    completedAt.setDate(
      completedAt.getDate() - taskData.daysAgo + (taskData.onTime ? -0.5 : 0.5)
    );

    await prisma.task.create({
      data: {
        title: taskData.title,
        description: "Test task",
        status: "DONE",
        requestId: request.id,
        assigneeId: user.id,
        createdAt,
        deadline,
        completedAt,
      } as any,
    });

    console.log(
      `  ✅ Created ${taskData.title} - ${taskData.onTime ? "On-time ✅" : "Late ⏰"}`
    );
  }

  console.log(`\n✨ Created ${tasks.length} test tasks!`);
  console.log("\n📊 Next steps:");
  console.log("1. Go to /personal");
  console.log("2. Click 'Đồng bộ stats' button");
  console.log("3. Stats will be recalculated from existing tasks");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
