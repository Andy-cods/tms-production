"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Logger } from "@/lib/utils/logger";
import { revalidatePath } from "next/cache";

// Zod schemas
const categorySchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(50, "Tên không quá 50 ký tự"),
  description: z.string().max(200, "Mô tả không quá 200 ký tự").optional(),
  teamId: z.string().nullable(),
  isActive: z.boolean().default(true),
});

type CategoryInput = z.infer<typeof categorySchema>;

/**
 * Check if user is ADMIN or LEADER
 */
async function assertAdminOrLeader() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  const user = session.user as any;
  if (user.role !== "ADMIN" && user.role !== "LEADER") {
    throw new Error("Forbidden: Only ADMIN or LEADER can manage categories");
  }
  
  return { userId: user.id, role: user.role };
}

/**
 * Create a new category
 */
export async function createCategory(data: CategoryInput) {
  try {
    const { userId } = await assertAdminOrLeader();

    // Validate input
    const validated = categorySchema.parse(data);

    // Check if name already exists (case-insensitive)
    const existing = await prisma.category.findFirst({
      where: {
        name: {
          equals: validated.name,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      throw new Error("Tên phân loại đã tồn tại");
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: validated.name,
        description: validated.description,
        teamId: validated.teamId,
        isActive: validated.isActive,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "CATEGORY_CREATED",
        entity: "Category",
        entityId: category.id,
        newValue: {
          name: category.name,
        },
      },
    });

    Logger.info("Category created", {
      action: "createCategory",
      categoryId: category.id,
      userId,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/requests/new");

    return { success: true, categoryId: category.id };
  } catch (error) {
    Logger.captureException(error as Error, { action: "createCategory" });
    throw error;
  }
}

/**
 * Update existing category
 */
export async function updateCategory(categoryId: string, data: Partial<CategoryInput>) {
  try {
    const { userId } = await assertAdminOrLeader();

    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      throw new Error("Category not found");
    }

    // Check name uniqueness if changing name
    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.category.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: "insensitive",
          },
          id: { not: categoryId },
        },
      });

      if (nameExists) {
        throw new Error("Tên phân loại đã tồn tại");
      }
    }

    // Update category
    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        description: data.description,
        teamId: data.teamId,
        isActive: data.isActive,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "CATEGORY_UPDATED",
        entity: "Category",
        entityId: categoryId,
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

    Logger.info("Category updated", {
      action: "updateCategory",
      categoryId,
      userId,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/requests/new");

    return { success: true };
  } catch (error) {
    Logger.captureException(error as Error, { action: "updateCategory", categoryId });
    throw error;
  }
}

/**
 * Toggle category active status
 */
export async function toggleCategoryStatus(categoryId: string) {
  try {
    const { userId } = await assertAdminOrLeader();

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        isActive: true,
        _count: {
          select: {
            requests: {
              where: {
                status: { in: ["OPEN", "IN_PROGRESS", "IN_REVIEW"] },
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    const newStatus = !category.isActive;

    // Warning if deactivating category with active requests
    if (!newStatus && category._count.requests > 0) {
      Logger.warn("Deactivating category with active requests", {
        categoryId,
        activeRequests: category._count.requests,
      });
    }

    // Update status
    await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: newStatus },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: newStatus ? "CATEGORY_ACTIVATED" : "CATEGORY_DEACTIVATED",
        entity: "Category",
        entityId: categoryId,
        newValue: { isActive: newStatus },
        oldValue: { isActive: category.isActive },
      },
    });

    Logger.info("Category status toggled", {
      action: "toggleCategoryStatus",
      categoryId,
      newStatus,
      userId,
    });

    revalidatePath("/admin/categories");

    return { success: true, isActive: newStatus };
  } catch (error) {
    Logger.captureException(error as Error, { action: "toggleCategoryStatus", categoryId });
    throw error;
  }
}

/**
 * Delete category
 */
export async function deleteCategory(categoryId: string) {
  try {
    const { userId } = await assertAdminOrLeader();

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
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

    if (!category) {
      throw new Error("Category not found");
    }

    // Check if category has requests
    if (category._count.requests > 0) {
      throw new Error(
        `Không thể xóa phân loại có ${category._count.requests} yêu cầu. Vui lòng chuyển các yêu cầu sang phân loại khác trước.`
      );
    }

    // Hard delete since no requests
    await prisma.category.delete({
      where: { id: categoryId },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "CATEGORY_DELETED",
        entity: "Category",
        entityId: categoryId,
        oldValue: {
          name: category.name,
        },
      },
    });

    Logger.info("Category deleted", {
      action: "deleteCategory",
      categoryId,
      userId,
    });

    revalidatePath("/admin/categories");

    return { success: true };
  } catch (error) {
    Logger.captureException(error as Error, { action: "deleteCategory", categoryId });
    throw error;
  }
}

