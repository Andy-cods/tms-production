import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Starting category migration...\n");

  // 1. Check current state
  const totalCategories = await prisma.category.count();
  const rootCategories = await prisma.category.count({
    where: { parentId: null },
  });
  const childCategories = await prisma.category.count({
    where: { parentId: { not: null } },
  });

  console.log("📊 Current state:");
  console.log(`   Total categories: ${totalCategories}`);
  console.log(`   Root categories: ${rootCategories}`);
  console.log(`   Child categories: ${childCategories}\n`);

  // 2. Update paths for all categories
  console.log("🔄 Updating category paths...");
  const allCategories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });

  for (const cat of allCategories) {
    const path = await buildPath(cat.id);
    await prisma.category.update({
      where: { id: cat.id },
      data: { path },
    });
  }

  console.log(`   ✅ Updated ${allCategories.length} category paths\n`);

  // 3. Verify integrity
  console.log("🔍 Verifying data integrity...");

  // Check orphan children (parent doesn't exist)
  const orphans = await prisma.category.findMany({
    where: {
      parentId: { not: null },
      parent: null,
    },
  });

  if (orphans.length > 0) {
    console.log(`   ⚠️  Found ${orphans.length} orphan categories`);
    for (const orphan of orphans) {
      console.log(`      - ${orphan.name} (parent: ${orphan.parentId})`);
      // Fix: set parentId to null
      await prisma.category.update({
        where: { id: orphan.id },
        data: { parentId: null },
      });
    }
    console.log(`   ✅ Fixed orphan categories\n`);
  } else {
    console.log(`   ✅ No orphan categories\n`);
  }

  // 4. Summary
  console.log("📊 Final state:");
  const finalTotal = await prisma.category.count();
  const finalRoot = await prisma.category.count({
    where: { parentId: null },
  });
  const finalChild = await prisma.category.count({
    where: { parentId: { not: null } },
  });

  console.log(`   Total categories: ${finalTotal}`);
  console.log(`   Root categories: ${finalRoot}`);
  console.log(`   Child categories: ${finalChild}`);

  console.log("\n✅ Migration complete!");
}

async function buildPath(categoryId: string): Promise<string> {
  const parts: string[] = [];
  let currentId: string | null = categoryId;

  while (currentId) {
    const cat = await prisma.category.findUnique({
      where: { id: currentId },
      select: { name: true, parentId: true },
    });

    if (!cat) break;

    parts.unshift(cat.name.toLowerCase().replace(/\s+/g, "-"));
    currentId = cat.parentId;
  }

  return parts.join("/");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
