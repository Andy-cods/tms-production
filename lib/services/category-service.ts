// lib/services/category-service.ts
// Category service with hierarchy support

import { prisma } from "@/lib/prisma";
import { CategoryNode, buildCategoryPath } from "@/types/category";

// Type exports for backward compatibility
export interface CategoryData {
  id: string;
  name: string;
  count: number;
  percentage: number;
  avgCompletionTime?: number;
}

// Re-export dashboard CategoryData type
export type { CategoryData as DashboardCategoryData } from "@/lib/types/dashboard";

export interface TagCloudData {
  tag: string;
  count: number;
  size: number;
  color: string;
}

export const categoryService = {
  /**
   * Get all categories as tree structure
   */
  async getCategoryTree(teamId?: string) {
    const categories = await prisma.category.findMany({
      where: teamId ? { teamId } : {},
      select: {
        id: true,
        name: true,
        description: true,
        teamId: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    // No hierarchy in schema; return flat list with level 0
    return categories.map((c) => ({ ...c, level: 0, children: [] as any[] }));
  },

  /**
   * Get categories by team (flat list)
   */
  async getCategoriesByTeam(teamId: string) {
    return prisma.category.findMany({
      where: { teamId },
      orderBy: [{ name: "asc" }],
    });
  },

  /**
   * Create category
   */
  async createCategory(data: {
    name: string;
    description?: string;
    teamId?: string;
    // ignored non-schema fields
  }) {
    return prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        teamId: data.teamId,
      },
    });
  },

  /**
   * Update category path (recursive)
   */
  async updateCategoryPaths(categoryId: string) {
    // No hierarchy fields in schema; noop
    return;
  },

  /**
   * Get breadcrumb for category
   */
  async getCategoryBreadcrumb(categoryId: string) {
    // No parent chain in schema; return single node breadcrumb
    const current = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true, name: true } });
    if (!current) return [];
    return [{ id: current.id, name: current.name }];
  },

  /**
   * Get category breakdown for analytics (backward compatibility)
   */
  async getCategoryBreakdown(filters?: any): Promise<CategoryData[]> {
    const where: any = {};
    
    if (filters?.teamId) {
      where.teamId = filters.teamId;
    }
    
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        requests: {
          where,
          select: {
            id: true,
            completedAt: true,
            createdAt: true,
          },
        },
      },
    });

    const total = categories.reduce((sum, cat) => sum + cat.requests.length, 0);

    return categories
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        count: cat.requests.length,
        percentage: total > 0 ? (cat.requests.length / total) * 100 : 0,
        avgCompletionTime: cat.requests.length > 0
          ? cat.requests.reduce((sum, req) => {
              if (req.completedAt && req.createdAt) {
                return sum + (new Date(req.completedAt).getTime() - new Date(req.createdAt).getTime()) / (1000 * 60 * 60); // hours
              }
              return sum;
            }, 0) / cat.requests.length
          : undefined,
      }))
      .filter(cat => cat.count > 0)
      .sort((a, b) => b.count - a.count);
  },

  /**
   * Get tag cloud data (backward compatibility)
   */
  async getTagCloudData(filters?: any): Promise<TagCloudData[]> {
    const where: any = {};

    if (filters?.teamId) {
      where.teamId = filters.teamId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const requests = await prisma.request.findMany({
      where,
      select: {
        tags: true,
      },
    });

    // Count tags
    const tagCounts: Record<string, number> = {};
    requests.forEach(req => {
      req.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const maxCount = Math.max(...Object.values(tagCounts), 1);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return Object.entries(tagCounts)
      .map(([tag, count], index) => ({
        tag,
        count,
        size: Math.max(12, Math.min(48, 12 + (count / maxCount) * 36)),
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Top 50 tags
  },
};
