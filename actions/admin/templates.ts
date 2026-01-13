"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Logger } from "@/lib/utils/logger";
import { revalidatePath } from "next/cache";
import { Priority } from "@prisma/client";

// Zod schemas
const templateSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(100, "Tên không quá 100 ký tự"),
  description: z.string().max(500, "Mô tả không quá 500 ký tự").optional().nullable(),
  icon: z.string().max(10, "Icon không quá 10 ký tự").optional().nullable(),
  defaultTitle: z.string().min(3, "Tiêu đề mặc định phải có ít nhất 3 ký tự").max(200, "Tiêu đề không quá 200 ký tự"),
  defaultDescription: z.string().max(1000, "Mô tả không quá 1000 ký tự").optional().nullable(),
  defaultPriority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  defaultCategoryId: z.string().optional().nullable(),
  estimatedDays: z.number().int().min(1, "Số ngày phải >= 1").max(365, "Số ngày không quá 365"),
  isPublic: z.boolean().default(false),
  checklistItems: z.array(
    z.object({
      title: z.string().min(1, "Tiêu đề checklist không được để trống"),
      description: z.string().optional().nullable(),
      order: z.number().int().min(0),
      estimatedHours: z.number().int().min(0).optional().nullable(),
      assignToRole: z.string().optional().nullable(),
    })
  ).optional(),
});

type TemplateInput = z.infer<typeof templateSchema>;

/**
 * Check if user is ADMIN
 */
async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = session.user as any;
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: Only ADMIN can manage templates");
  }

  return user.id;
}

/**
 * Update existing template
 */
export async function updateTemplate(templateId: string, data: Partial<TemplateInput>) {
  try {
    const userId = await assertAdmin();

    // Get existing template
    const existing = await prisma.taskTemplate.findUnique({
      where: { id: templateId },
      include: {
        checklistItems: true,
      },
    });

    if (!existing) {
      throw new Error("Template không tồn tại");
    }

    // Check name uniqueness if changing name
    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.taskTemplate.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: "insensitive",
          },
          id: { not: templateId },
        },
      });

      if (nameExists) {
        throw new Error("Tên template đã tồn tại");
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.defaultTitle !== undefined) updateData.defaultTitle = data.defaultTitle;
    if (data.defaultDescription !== undefined) updateData.defaultDescription = data.defaultDescription;
    if (data.defaultPriority !== undefined) updateData.defaultPriority = data.defaultPriority as Priority;
    if (data.defaultCategoryId !== undefined) updateData.defaultCategoryId = data.defaultCategoryId;
    if (data.estimatedDays !== undefined) updateData.estimatedDays = data.estimatedDays;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    // Update template
    const updated = await prisma.taskTemplate.update({
      where: { id: templateId },
      data: updateData,
    });

    // Update checklist items if provided
    if (data.checklistItems !== undefined) {
      // Delete existing checklist items
      await prisma.templateChecklistItem.deleteMany({
        where: { templateId },
      });

      // Create new checklist items
      if (data.checklistItems.length > 0) {
        await prisma.templateChecklistItem.createMany({
          data: data.checklistItems.map((item) => ({
            templateId,
            title: item.title,
            description: item.description || null,
            order: item.order,
            estimatedHours: item.estimatedHours || null,
            assignToRole: item.assignToRole || null,
          })),
        });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "TEMPLATE_UPDATED",
        entity: "TaskTemplate",
        entityId: templateId,
        oldValue: {
          name: existing.name,
          description: existing.description,
        },
        newValue: {
          name: updated.name,
          description: updated.description,
        },
      },
    });

    Logger.info("Template updated", {
      action: "updateTemplate",
      templateId,
      userId,
    });

    revalidatePath("/admin/templates");
    revalidatePath("/requests/new");

    return { success: true };
  } catch (error) {
    Logger.captureException(error as Error, { action: "updateTemplate", templateId });
    throw error;
  }
}

/**
 * Delete template
 */
export async function deleteTemplate(templateId: string) {
  try {
    const userId = await assertAdmin();

    const template = await prisma.taskTemplate.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            requests: true,
          },
        },
      },
    });

    if (!template) {
      throw new Error("Template không tồn tại");
    }

    // Warn if template has been used, but allow admin to delete
    if (template._count.requests > 0) {
      Logger.warn("Deleting template that has been used", {
        templateId,
        requestCount: template._count.requests,
        userId,
      });
      // Allow deletion but warn - admin can override
    }

    // Delete checklist items first (cascade should handle this, but let's be explicit)
    await prisma.templateChecklistItem.deleteMany({
      where: { templateId },
    });

    // Delete the template
    await prisma.taskTemplate.delete({
      where: { id: templateId },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "TEMPLATE_DELETED",
        entity: "TaskTemplate",
        entityId: templateId,
        oldValue: {
          name: template.name,
        },
      },
    });

    Logger.info("Template deleted", {
      action: "deleteTemplate",
      templateId,
      userId,
    });

    revalidatePath("/admin/templates");

    return { success: true };
  } catch (error) {
    Logger.captureException(error as Error, { action: "deleteTemplate", templateId });
    throw error;
  }
}

