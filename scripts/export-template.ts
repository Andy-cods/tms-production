import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function exportTemplate(templateId: string) {
  const template = await prisma.requestTemplate.findUnique({
    where: { id: templateId },
    include: {
      fields: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!template) {
    console.error("❌ Template not found");
    return;
  }

  // Remove IDs and timestamps for clean import
  const exportData = {
    name: template.name,
    description: template.description,
    icon: template.icon,
    isActive: template.isActive,
    isDefault: template.isDefault,
    fields: template.fields.map((f) => ({
      name: f.name,
      label: f.label,
      description: f.description,
      type: f.type,
      isRequired: f.isRequired,
      minLength: f.minLength,
      maxLength: f.maxLength,
      minValue: f.minValue,
      maxValue: f.maxValue,
      pattern: f.pattern,
      options: f.options,
      defaultValue: f.defaultValue,
      placeholder: f.placeholder,
      order: f.order,
    })),
  };

  const outputDir = path.join(process.cwd(), "templates");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const filename = `${template.name
    .toLowerCase()
    .replace(/\s+/g, "-")}.json`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

  console.log(`✅ Template exported to: ${filepath}`);
}

// Usage: npx ts-node scripts/export-template.ts <templateId>
const templateId = process.argv[2];

if (!templateId) {
  console.error("Usage: npx ts-node scripts/export-template.ts <templateId>");
  process.exit(1);
}

exportTemplate(templateId)
  .catch(console.error)
  .finally(() => prisma.$disconnect());

