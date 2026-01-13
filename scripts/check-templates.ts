import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking templates in database...\n");

  const templates = await prisma.taskTemplate.findMany({
    where: {
      name: {
        contains: "Marketing",
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      defaultTitle: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  console.log(`Found ${templates.length} Marketing templates:\n`);
  
  templates.forEach((t, i) => {
    console.log(`${i + 1}. ${t.name}`);
    console.log(`   ID: ${t.id}`);
    console.log(`   Default Title: ${t.defaultTitle}`);
    console.log();
  });

  // Check for English templates (common English words in template names)
  const englishKeywords = [
    "Video",
    "Content",
    "Visual",
    "Pack",
    "Ads",
    "Campaign",
    "Report",
    "Strategy",
    "Discovery",
    "Blueprint",
    "Optimization",
    "Hero",
    "Snack",
  ];

  const englishTemplates = templates.filter((t) => {
    // Check if template name contains only English words (no Vietnamese characters)
    const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(t.name);
    const hasEnglishOnly = englishKeywords.some((keyword) =>
      t.name.includes(keyword)
    );
    
    // If it has English keywords but no Vietnamese characters, it might be English-only
    return !hasVietnamese && hasEnglishOnly;
  });

  if (englishTemplates.length > 0) {
    console.log(`\n⚠️  Found ${englishTemplates.length} potential English templates:\n`);
    englishTemplates.forEach((t) => {
      console.log(`- ${t.name} (${t.id})`);
    });
  } else {
    console.log("\n✅ All templates appear to be in Vietnamese");
  }
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

