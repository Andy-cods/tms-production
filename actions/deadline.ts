"use server";

import { auth } from "@/lib/auth";
import { deadlineCalculator } from "@/lib/services/deadline-calculator";

export async function getDeadlineRange(categoryId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const range = await deadlineCalculator.getDeadlineRange(categoryId);

    if (!range) {
      return { success: false, error: "Category không tồn tại" };
    }

    return {
      success: true,
      range: {
        min: range.min.toISOString(),
        max: range.max.toISOString(),
        suggested: range.suggested.toISOString(),
        category: range.category,
      },
    };
  } catch (error) {
    console.error("[getDeadlineRange]:", error);
    return { success: false, error: "Lỗi tải deadline range" };
  }
}

export async function validateDeadline(categoryId: string, deadline: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const validation = await deadlineCalculator.validateDeadline(
      categoryId,
      new Date(deadline)
    );

    return {
      success: true,
      validation,
    };
  } catch (error) {
    console.error("[validateDeadline]:", error);
    return { success: false, error: "Lỗi validate deadline" };
  }
}

export async function updateCategoryStats(categoryId?: string) {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Không có quyền" };
    }

    if (categoryId) {
      const stats = await deadlineCalculator.updateCategoryStats(categoryId);
      return { success: true, stats };
    } else {
      const results = await deadlineCalculator.updateAllCategoryStats();
      return { success: true, results };
    }
  } catch (error) {
    console.error("[updateCategoryStats]:", error);
    return { success: false, error: "Lỗi cập nhật stats" };
  }
}
