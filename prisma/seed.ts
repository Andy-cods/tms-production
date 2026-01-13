// @ts-nocheck
// Load environment variables from .env.local
import { readFileSync } from "fs";
import { join } from "path";

try {
  const envLocalPath = join(process.cwd(), ".env.local");
  const envContent = readFileSync(envLocalPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").replace(/^["']|["']$/g, ""); // Remove quotes
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (err) {
  console.warn("⚠️  Could not load .env.local, using system environment variables");
}

import { PrismaClient, Priority } from "@prisma/client";
// import { seedPermissions } from "./seeds/permissions"; // TODO: Permission model not implemented yet
const prisma = new PrismaClient();

async function seedHierarchicalCategories(teams: Record<string, any>) {
  console.log("🗂️  Seeding hierarchical categories...");

  const categories: Record<string, any> = {};


  // ============================================
  // MARKETING TEAM CATEGORIES
  // ============================================

  const mktContent = await prisma.category.upsert({
    where: { id: "cat-mkt-content" },
    update: {},
    create: {
      id: "cat-mkt-content",
      name: "Content Marketing",
      description: "Blog posts & articles",
      estimatedDuration: 120, // 5 days
      team: {
        connect: { id: teams.marketing.id },
      },
    },
  });
  categories["mktContent"] = mktContent;

  const mktSocial = await prisma.category.upsert({
    where: { id: "cat-mkt-social" },
    update: {},
    create: {
      id: "cat-mkt-social",
      name: "Social Media",
      description: "Social media management",
      estimatedDuration: 24, // 1 day
      team: {
        connect: { id: teams.marketing.id },
      },
    },
  });
  categories["mktSocial"] = mktSocial;

  const mktSEO = await prisma.category.upsert({
    where: { id: "cat-mkt-seo" },
    update: {},
    create: {
      id: "cat-mkt-seo",
      name: "SEO & Analytics",
      description: "Search engine optimization",
      estimatedDuration: 48, // 2 days
      team: {
        connect: { id: teams.marketing.id },
      },
    },
  });
  categories["mktSEO"] = mktSEO;

  console.log("  ✅ Seeded 6 categories");
  
  return categories;
}

async function main() {
  
  // 1) Teams and Admin User (must be first)
  const { seedTeamsAndAdmin } = await import("./seeds/teams-and-admin");
  await seedTeamsAndAdmin();

  // 2) PriorityConfig questions
  const priorityConfigs = [
    {
      question: "Mức độ khẩn cấp (1=Không gấp, 5=Cực gấp)",
      weight: 1.5,
      order: 1,
    },
    {
      question: "Mức độ tác động (1=Ít người, 5=Toàn tổ chức)",
      weight: 2.0,
      order: 2,
    },
    {
      question: "Rủi ro nếu trễ (1=Không đáng kể, 5=Nghiêm trọng)",
      weight: 1.5,
      order: 3,
    },
  ];

  for (const config of priorityConfigs) {
    // Check if config already exists
    const existing = await prisma.priorityConfig.findFirst({
      where: {
        question: config.question,
      },
    });

    if (!existing) {
      await prisma.priorityConfig.create({
        data: {
          question: config.question,
          weight: config.weight,
          order: config.order,
          isActive: true,
        },
      });
    }
  }

  // 4) PriorityThreshold mappings
  const priorityThresholds = [
    {
      minScore: 0,
      maxScore: 7.5,
      priority: "LOW" as const,
    },
    {
      minScore: 7.5,
      maxScore: 12.5,
      priority: "MEDIUM" as const,
    },
    {
      minScore: 12.5,
      maxScore: 17.5,
      priority: "HIGH" as const,
    },
    {
      minScore: 17.5,
      maxScore: 25,
      priority: "URGENT" as const,
    },
  ];

  for (const threshold of priorityThresholds) {
    // Check if threshold already exists
    const existing = await prisma.priorityThreshold.findFirst({
      where: {
        minScore: threshold.minScore,
        maxScore: threshold.maxScore,
        priority: threshold.priority,
      },
    });

    if (!existing) {
      await prisma.priorityThreshold.create({
        data: {
          minScore: threshold.minScore,
          maxScore: threshold.maxScore,
          priority: threshold.priority,
        },
      });
    }
  }

  // 5) SLA Configurations
  const slaConfigs = [
    // REQUEST SLAs
    {
      name: "Triage yêu cầu - Tất cả",
      targetEntity: "REQUEST",
      priority: null,
      category: null,
      targetHours: 8.0,
      description: "Leader phải phân công trong 8 giờ",
    },
    {
      name: "Phản hồi làm rõ",
      targetEntity: "REQUEST", 
      priority: null,
      category: null,
      targetHours: 8.0,
      description: "Người yêu cầu phải trả lời clarification trong 8 giờ",
    },
    // TASK SLAs
    {
      name: "Xác nhận High Priority",
      targetEntity: "TASK",
      priority: "HIGH" as const,
      category: null,
      targetHours: 1.0,
      description: "Assignee xác nhận nhận việc trong 1 giờ",
    },
    {
      name: "Xác nhận Normal Priority",
      targetEntity: "TASK",
      priority: "MEDIUM" as const,
      category: null,
      targetHours: 4.0,
      description: "Assignee xác nhận nhận việc trong 4 giờ",
    },
    {
      name: "Xác nhận Low Priority",
      targetEntity: "TASK",
      priority: "LOW" as const,
      category: null,
      targetHours: 8.0,
      description: "Assignee xác nhận nhận việc trong 8 giờ",
    },
    {
      name: "Review mỗi vòng",
      targetEntity: "TASK",
      priority: null,
      category: null,
      targetHours: 24.0,
      description: "Leader review task trong 24 giờ",
    },
  ];

  for (const config of slaConfigs) {
    // Check if SLA config already exists
    const existing = await prisma.slaConfig.findFirst({
      where: {
        name: config.name,
      },
    });

    if (!existing) {
      await prisma.slaConfig.create({
        data: {
          name: config.name,
          targetEntity: config.targetEntity,
          priority: config.priority,
          category: config.category,
          targetHours: config.targetHours,
          description: config.description,
          isActive: true,
        },
      });
    }
  }

  // 6) Templates

  // 6.1) HR Templates
  const { seedHRTemplates } = await import("./seeds/hr-templates");
  await seedHRTemplates();

  // 6.2) Finance Templates
  const { seedFinanceTemplates } = await import("./seeds/finance-templates");
  await seedFinanceTemplates();

  // 6.3) Accounting Templates
  const { seedAccountingTemplates } = await import("./seeds/accounting-templates");
  await seedAccountingTemplates();

  // 6.4) Customer Service Templates
  const { seedCustomerServiceTemplates } = await import("./seeds/customer-service-templates");
  await seedCustomerServiceTemplates();

  // 6.5) Marketing Templates
  const { seedMarketingTemplates } = await import("./seeds/marketing-templates");
  await seedMarketingTemplates();

  // 6.6) Business Templates (Phòng Kinh doanh)
  const { seedBusinessTemplates } = await import("./seeds/business-templates");
  await seedBusinessTemplates();

  // 6.7) IT Team (if not created by templates)
  const { seedITTeam } = await import("./seeds/it-team");
  await seedITTeam();

  // 7) Achievements & Badges
  const { seedAchievements } = await import("./seeds/achievements");
  await seedAchievements();

  // 8) Positions
  const { seedPositions } = await import("./seeds/positions");
  await seedPositions();

  // 9) Import Employees (BC Agency staff)
  const { importEmployees } = await import("./seeds/import-employees");
  await importEmployees();

  // 11) Permissions
  // await seedPermissions(); // TODO: Permission model not implemented yet

  console.log("✅ Seed completed successfully!");
  console.log(`📊 Created:`);
  console.log(`   - Teams, Categories, SLA Configs`);
  console.log(`   - Priority configs and thresholds`);
  console.log(`   - HR, Finance, Accounting, Customer Service, Marketing, Business templates`);
  console.log(`   - 10 achievements`);
  console.log(`   - Positions`);
  console.log(`   - Demo users (Staff & Leader)`);
  console.log(`   - BC Agency employees (19 users)`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
