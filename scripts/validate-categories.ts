import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Validating category hierarchy...\n");

  let errors = 0;

  // 1. Check circular references
  console.log("1. Checking for circular references...");
  const categories = await prisma.category.findMany();

  for (const cat of categories) {
    if (hasCircularReference(cat.id, cat.parentId, categories)) {
      console.log(`   ❌ Circular reference detected: ${cat.name}`);
      errors++;
    }
  }

  if (errors === 0) {
    console.log("   ✅ No circular references\n");
  } else {
    console.log(`   ⚠️  ${errors} circular references found\n`);
  }

  // 2. Check max depth (should be max 3: root → parent → child)
  console.log("2. Checking hierarchy depth...");
  errors = 0;

  for (const cat of categories) {
    const depth = getDepth(cat.id, categories);
    if (depth > 2) {
      console.log(`   ❌ Too deep (${depth} levels): ${cat.name}`);
      errors++;
    }
  }

  if (errors === 0) {
    console.log("   ✅ All categories within 3 levels\n");
  } else {
    console.log(`   ⚠️  ${errors} categories too deep\n`);
  }

  // 3. Check duplicate paths
  console.log("3. Checking for duplicate paths...");
  const paths = categories.map((c) => c.path).filter((p): p is string => Boolean(p));
  const duplicates = paths.filter((p, i) => paths.indexOf(p) !== i);

  if (duplicates.length > 0) {
    console.log(`   ❌ Duplicate paths found:`);
    Array.from(new Set(duplicates)).forEach((p) => console.log(`      - ${p}`));
  } else {
    console.log("   ✅ No duplicate paths\n");
  }

  // 4. Statistics
  console.log("📊 Category Statistics:");
  const stats = {
    total: categories.length,
    active: categories.filter((c) => c.isActive).length,
    withTeam: categories.filter((c) => c.teamId).length,
    withIcon: categories.filter((c) => c.icon).length,
    root: categories.filter((c) => !c.parentId).length,
    withChildren: await prisma.category.count({
      where: {
        children: {
          some: {},
        },
      },
    }),
  };

  console.log(`   Total: ${stats.total}`);
  console.log(`   Active: ${stats.active}`);
  console.log(`   With team: ${stats.withTeam}`);
  console.log(`   With icon: ${stats.withIcon}`);
  console.log(`   Root categories: ${stats.root}`);
  console.log(`   With children: ${stats.withChildren}`);

  console.log("\n✅ Validation complete!");
}

function hasCircularReference(
  categoryId: string,
  parentId: string | null,
  categories: Array<{ id: string; parentId: string | null }>
): boolean {
  if (!parentId) return false;

  const visited = new Set<string>();
  let currentId: string | null = parentId;

  while (currentId) {
    if (currentId === categoryId) return true;
    if (visited.has(currentId)) return true;

    visited.add(currentId);
    const parent = categories.find((c) => c.id === currentId);
    currentId = parent?.parentId || null;
  }

  return false;
}

function getDepth(categoryId: string, categories: Array<{ id: string; parentId: string | null }>): number {
  let depth = 0;
  let currentId: string | null = categoryId;

  while (currentId) {
    const cat = categories.find((c) => c.id === currentId);
    if (!cat || !cat.parentId) break;
    depth++;
    currentId = cat.parentId;
  }

  return depth;
}

main()
  .catch((e) => {
    console.error("❌ Validation failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
