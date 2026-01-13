import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Deleting old template 'Marketing - Content - Bài PR'...\n");

  const oldTemplate = await prisma.taskTemplate.findFirst({
    where: {
      name: "Marketing - Content - Bài PR",
    },
    select: {
      id: true,
      name: true,
      usageCount: true,
    },
  });

  if (oldTemplate) {
    console.log(`Found template: ${oldTemplate.name} (ID: ${oldTemplate.id})`);
    if (oldTemplate.usageCount > 0) {
      console.log(`⚠️  Warning: This template has been used ${oldTemplate.usageCount} times`);
    }

    // Delete checklist items first
    await prisma.templateChecklistItem.deleteMany({
      where: {
        templateId: oldTemplate.id,
      },
    });

    // Delete the template
    await prisma.taskTemplate.delete({
      where: {
        id: oldTemplate.id,
      },
    });

    console.log("✅ Deleted successfully");
  } else {
    console.log("❌ Template not found");
  }

  console.log("\n📊 Remaining Marketing templates:");

  const remainingTemplates = await prisma.taskTemplate.findMany({
    where: {
      name: {
        contains: "Marketing",
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  console.log(`   Total: ${remainingTemplates.length} templates\n`);
  remainingTemplates.forEach((t, i) => {
    console.log(`   ${i + 1}. ${t.name}`);
  });
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

