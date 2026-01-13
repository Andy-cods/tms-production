"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { categoryService } from "@/lib/services/category-service";

/**
 * Get category tree by team
 */
export async function getCategoryTree(teamId?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const tree = await categoryService.getCategoryTree(teamId);

    return {
      success: true,
      categories: tree,
    };
  } catch (error) {
    console.error("[getCategoryTree]:", error);
    return { success: false, error: "Lỗi tải categories" };
  }
}

/**
 * Get all categories (flat list)
 */
export async function getAllCategories(teamId?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const categories = await prisma.category.findMany({
      where: teamId ? { teamId, isActive: true } : { isActive: true },
      select: {
        id: true,
        name: true,
        teamId: true,
      },
      orderBy: [{ teamId: "asc" }],
    });

    return { success: true, categories };
  } catch (error) {
    console.error("[getAllCategories]:", error);
    return { success: false, error: "Lỗi tải categories" };
  }
}

/**
 * Get category breadcrumb
 */
export async function getCategoryBreadcrumb(categoryId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const breadcrumb = await categoryService.getCategoryBreadcrumb(categoryId);

    return {
      success: true,
      breadcrumb,
    };
  } catch (error) {
    console.error("[getCategoryBreadcrumb]:", error);
    return { success: false, error: "Lỗi tải breadcrumb" };
  }
}

/**
 * Create category (Admin only)
 */
export async function createCategory(data: {
  name: string;
  description?: string;
  teamId?: string;
}) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Không có quyền" };
    }

    const category = await categoryService.createCategory({
      name: data.name,
      description: data.description,
      teamId: data.teamId,
    } as any);

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Category",
        entityId: category.id,
        userId: (session.user as any).id,
        newValue: ({
          name: category.name,
          teamId: category.teamId,
        } as unknown) as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/requests/new");

    return { success: true, category };
  } catch (error) {
    console.error("[createCategory]:", error);
    return { success: false, error: "Lỗi tạo category" };
  }
}

/**
 * Update category (Admin only)
 */
export async function updateCategory(
  categoryId: string,
  data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Không có quyền" };
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Category",
        entityId: category.id,
        userId: (session.user as any).id,
        newValue: (data as unknown) as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/categories");

    return { success: true, category };
  } catch (error) {
    console.error("[updateCategory]:", error);
    return { success: false, error: "Lỗi cập nhật category" };
  }
}

/**
 * Delete category (Admin only)
 */
export async function deleteCategory(categoryId: string) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Không có quyền" };
    }

    // Check if category is used in requests
    const requestCount = await prisma.request.count({
      where: { categoryId },
    });

    if (requestCount > 0) {
      return {
        success: false,
        error: `Category đang được dùng trong ${requestCount} requests`,
      };
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entity: "Category",
        entityId: categoryId,
        userId: (session.user as any).id,
        newValue: ({} as unknown) as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/categories");

    return { success: true };
  } catch (error) {
    console.error("[deleteCategory]:", error);
    return { success: false, error: "Lỗi xóa category" };
  }
}

/**
 * Reorder categories
 */
export async function reorderCategories(
  categoryIds: string[]
) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Không có quyền" };
    }

    // Not supported: Category has no order field in schema

    revalidatePath("/admin/categories");

    return { success: true };
  } catch (error) {
    console.error("[reorderCategories]:", error);
    return { success: false, error: "Lỗi sắp xếp categories" };
  }
}

/**
 * Update category preferred positions (Admin only)
 */
export async function updateCategoryPositions(
  _categoryId: string,
  _data: {
    preferredPositions: string[];
    requireExactMatch?: boolean;
  }
) {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Không có quyền" };
    }

    return { success: false, error: "Chức năng không hỗ trợ" };
  } catch (error) {
    console.error("[updateCategoryPositions]:", error);
    return { success: false, error: "Lỗi cập nhật positions" };
  }
}

/**
 * Get unique positions from all users
 */
export async function getAllUserPositions() {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Không có quyền" };
    }

    return { success: false, error: "Chức năng không hỗ trợ" };
  } catch (error) {
    console.error("[getAllUserPositions]:", error);
    return { success: false, error: "Lỗi tải positions" };
  }
}

