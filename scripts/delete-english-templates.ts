import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// List of English template IDs to delete
const englishTemplateIds = [
  "cmhoory3n002gk5gkuy35znl6", // Marketing - Ads - Campaign Launch
  "cmhoos1h8002vk5gk4oxfsv8h", // Marketing - Ads - Monthly Review
  "cmhoorz86002lk5gk63cd7xmc", // Marketing - Ads - Optimization Sprint
  "cmhoos0cm002qk5gkv6peep0e", // Marketing - Ads - Weekly Report
  "cmhoorvun0024k5gkyoh48e02", // Marketing - Content - SEO Premium
  "cmhooruq3001zk5gk98m8cpvk", // Marketing - Content - SEO Standard
  "cmhoorwz2002ak5gk6824f9ob", // Marketing - Content Weekly Plan
  "cmhoos43q0035k5gkbaozvcmd", // Marketing - Strategy - Blueprint
  "cmhoos2za002zk5gkoeqcrs2u", // Marketing - Strategy - Discovery
  "cmhoos58a0039k5gk8ad4io9t", // Marketing - Strategy - Optimization
  "cmhoorl4m000qk5gkb5vtjhg3", // Marketing - Video Hero 30-60s - Basic
  "cmhoorors0017k5gk5252o6ec", // Marketing - Video Hero 30-60s - Documentary
  "cmhoornn70011k5gkz07bdw1h", // Marketing - Video Hero 30-60s - Highlight
  "cmhoorm95000wk5gkn0cv5vmg", // Marketing - Video Hero 30-60s - Subtitle
  "cmhoorfqr0001k5gk9xi0mndd", // Marketing - Video Snack - Basic
  "cmhoorimh000dk5gk2ot036xq", // Marketing - Video Snack - Highlight
  "cmhoorjtd000jk5gkxwd3akla", // Marketing - Video Snack - Premium
  "cmhoorhhr0007k5gktxeo4htn", // Marketing - Video Snack - Subtitle
  "cmhoorrac001jk5gkewj7ifo0", // Marketing - Visual Pack - Advanced
  "cmhoorpz4001ek5gkeva39vaq", // Marketing - Visual Pack - Basic
  "cmhoorsh1001pk5gkn5nkh3h8", // Marketing - Visual Pack - Batch
];

// Also check for "Content - Bài PR" (should be kept, but the English one should be removed if exists)
const englishTemplateNames = [
  "Marketing - Ads - Campaign Launch",
  "Marketing - Ads - Monthly Review",
  "Marketing - Ads - Optimization Sprint",
  "Marketing - Ads - Weekly Report",
  "Marketing - Content - SEO Premium",
  "Marketing - Content - SEO Standard",
  "Marketing - Content Weekly Plan",
  "Marketing - Strategy - Blueprint",
  "Marketing - Strategy - Discovery",
  "Marketing - Strategy - Optimization",
  "Marketing - Video Hero 30-60s - Basic",
  "Marketing - Video Hero 30-60s - Documentary",
  "Marketing - Video Hero 30-60s - Highlight",
  "Marketing - Video Hero 30-60s - Subtitle",
  "Marketing - Video Snack - Basic",
  "Marketing - Video Snack - Highlight",
  "Marketing - Video Snack - Premium",
  "Marketing - Video Snack - Subtitle",
  "Marketing - Visual Pack - Advanced",
  "Marketing - Visual Pack - Basic",
  "Marketing - Visual Pack - Batch",
];

async function main() {
  console.log("🗑️  Deleting English templates...\n");

  // Find all English templates by name
  const englishTemplates = await prisma.taskTemplate.findMany({
    where: {
      name: {
        in: englishTemplateNames,
      },
    },
    select: {
      id: true,
      name: true,
      usageCount: true,
    },
  });

  console.log(`Found ${englishTemplates.length} English templates to delete:\n`);

  for (const template of englishTemplates) {
    console.log(`  🗑️  Deleting: ${template.name} (ID: ${template.id})`);
    if (template.usageCount > 0) {
      console.log(`     ⚠️  Warning: This template has been used ${template.usageCount} times`);
    }

    try {
      // Delete checklist items first (cascade should handle this, but let's be explicit)
      await prisma.templateChecklistItem.deleteMany({
        where: {
          templateId: template.id,
        },
      });

      // Delete the template
      await prisma.taskTemplate.delete({
        where: {
          id: template.id,
        },
      });

      console.log(`     ✅ Deleted successfully`);
    } catch (error) {
      console.error(`     ❌ Error deleting: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  console.log(`\n✅ Deleted ${englishTemplates.length} English templates`);
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

