import { PrismaClient, FieldType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function importTemplate(filepath: string, createdBy: string) {
  const data = JSON.parse(fs.readFileSync(filepath, "utf-8"));

  const template = await prisma.requestTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      icon: data.icon,
      isActive: data.isActive ?? true,
      isDefault: data.isDefault ?? false,
      createdBy,
      fields: {
        create: data.fields.map((field: any) => ({
          name: field.name,
          label: field.label,
          description: field.description,
          type: field.type as FieldType,
          isRequired: field.isRequired,
          minLength: field.minLength,
          maxLength: field.maxLength,
          minValue: field.minValue,
          maxValue: field.maxValue,
          pattern: field.pattern,
          options: field.options,
          defaultValue: field.defaultValue,
          placeholder: field.placeholder,
          order: field.order,
        })),
      },
    },
    include: {
      fields: true,
    },
  });

  console.log(`✅ Template imported: ${template.name} (${template.id})`);
  console.log(`   ${template.fields.length} fields`);
}

// Usage: npx ts-node scripts/import-template.ts <filepath> <createdByUserId>
const filepath = process.argv[2];
const createdBy = process.argv[3];

if (!filepath || !createdBy) {
  console.error(
    "Usage: npx ts-node scripts/import-template.ts <filepath> <userId>"
  );
  process.exit(1);
}

importTemplate(filepath, createdBy)
  .catch(console.error)
  .finally(() => prisma.$disconnect());

