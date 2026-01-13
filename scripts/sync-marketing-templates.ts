import { PrismaClient } from "@prisma/client";
import {
  CATALOG_ITEMS,
  MARKETING_TEMPLATES,
  SALES_TEMPLATES,
  CatalogItem,
  CatalogTemplate,
} from "../lib/catalog";

const prisma = new PrismaClient();

const minutesToDays = (minutes: number) =>
  Math.max(1, Math.ceil(minutes / (8 * 60))); // 1 day = 8h

const minutesToHours = (minutes: number) =>
  Math.max(1, Math.round(minutes / 60));

const catalogItemMap = new Map<string, CatalogItem>(
  CATALOG_ITEMS.map((item) => [item.id, item])
);

const CATEGORY_IDS = {
  SOCIAL: "cat-mkt-social",
  CONTENT: "cat-mkt-content",
  SEO: "cat-mkt-seo",
  SALES: "cat-sales-general",
};

// Ensure sales category exists
async function ensureSalesCategory() {
  const salesTeam = await prisma.team.findFirst({
    where: { name: { contains: "Sales", mode: "insensitive" } },
  });

  let category = await prisma.category.findUnique({
    where: { id: CATEGORY_IDS.SALES },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        id: CATEGORY_IDS.SALES,
        name: "Kinh doanh",
        description: "Quản lý kinh doanh và bán hàng",
        estimatedDuration: 120, // 5 days
        ...(salesTeam && { teamId: salesTeam.id }),
      },
    });
    console.log("  ➕ Created sales category");
  }

  return category.id;
}

const pickCategoryId = async (
  template: CatalogTemplate,
  templateType: "marketing" | "sales"
): Promise<string | undefined> => {
  if (templateType === "sales") {
    return await ensureSalesCategory();
  }

  // Marketing templates
  const tags = template.tags ?? [];
  if (tags.includes("seo")) return CATEGORY_IDS.SEO;
  if (tags.includes("ads")) return CATEGORY_IDS.SEO;
  if (tags.includes("content") || tags.includes("plan")) return CATEGORY_IDS.CONTENT;
  if (tags.includes("strategy")) return CATEGORY_IDS.CONTENT;
  if (tags.includes("video") || tags.includes("design") || tags.includes("social")) {
    return CATEGORY_IDS.SOCIAL;
  }
  return undefined;
};

const buildDescription = (template: CatalogTemplate) => {
  const items = template.catalogItemIds
    .map((id) => catalogItemMap.get(id))
    .filter(Boolean) as CatalogItem[];

  const bullets = items
    .map(
      (item) =>
        `- ${item.name} (${item.estimatedMinutes} phút)\n  ${item.description}`
    )
    .join("\n");

  return `${template.description}\n\nChecklist: \n${bullets}`;
};

async function syncTemplates(
  templates: CatalogTemplate[],
  prefix: string,
  templateType: "marketing" | "sales",
  adminId: string
) {
  for (const template of templates) {
    const name = `${prefix} - ${template.name}`;
    const existing = await prisma.taskTemplate.findFirst({ where: { name } });
    const categoryId = await pickCategoryId(template, templateType);

    const checklistItems = template.catalogItemIds
      .map((id, index) => {
        const item = catalogItemMap.get(id);
        if (!item) return null;
        return {
          title: item.name,
          description: `${item.description} (Ước tính ${item.estimatedMinutes} phút)`,
          order: index,
          estimatedHours: minutesToHours(item.estimatedMinutes),
        };
      })
      .filter(Boolean) as Array<{
      title: string;
      description?: string;
      order: number;
      estimatedHours: number;
    }>;

    const defaultTitle = templateType === "sales" 
      ? `${template.name}`
      : `{{campaign_name}} - ${template.name}`;

    const payload = {
      name,
      description: template.description,
      icon: template.icon || "📦",
      defaultTitle,
      defaultDescription: buildDescription(template),
      defaultPriority: "MEDIUM" as const,
      defaultCategoryId: categoryId,
      estimatedDays: minutesToDays(template.estimatedMinutes),
      isPublic: true,
      createdById: adminId,
      usageCount: existing?.usageCount ?? 0,
      variables: {
        catalogId: template.id,
        tags: template.tags ?? [],
        estimatedMinutes: template.estimatedMinutes,
      },
    };

    if (existing) {
      console.log(`  🔁 Update ${name}`);
      await prisma.taskTemplate.update({
        where: { id: existing.id },
        data: {
          ...payload,
          checklistItems: {
            deleteMany: {},
            create: checklistItems,
          },
        },
      });
    } else {
      console.log(`  ➕ Create ${name}`);
      await prisma.taskTemplate.create({
        data: {
          ...payload,
          checklistItems: {
            create: checklistItems,
          },
        },
      });
    }
  }
}

async function main() {
  console.log("🌱 Syncing templates...");

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  if (!admin) {
    console.error("❌ Không tìm thấy admin. Vui lòng tạo admin trước.");
    process.exit(1);
  }

  console.log("📦 Syncing marketing templates...");
  await syncTemplates(MARKETING_TEMPLATES, "Marketing", "marketing", admin.id);

  console.log("💰 Syncing sales templates...");
  await syncTemplates(SALES_TEMPLATES, "Sales", "sales", admin.id);

  console.log("✅ All templates synced!");
}

main()
  .catch((error) => {
    console.error("❌ Error syncing templates", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


