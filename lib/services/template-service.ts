import { prisma } from "@/lib/prisma";

export const templateService = {
  /**
   * Get all templates (public + user's private)
   */
  async getTemplates(userId: string, categoryId?: string) {
    try {
      const templates = await prisma.taskTemplate.findMany({
        where: {
          OR: [{ isPublic: true }, { createdById: userId }],
          ...(categoryId && { defaultCategoryId: categoryId }),
        },
        include: {
          defaultCategory: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          checklistItems: {
            orderBy: {
              order: "asc",
            },
          },
          _count: {
            select: {
              checklistItems: true,
            },
          },
        },
        orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
      });

      return { success: true, templates };
    } catch (error) {
      console.error("[getTemplates] Error:", error);
      return { success: false, error: "Lỗi tải templates" };
    }
  },

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string, userId: string) {
    try {
      const template = await prisma.taskTemplate.findUnique({
        where: { id: templateId },
        include: {
          defaultCategory: true,
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          checklistItems: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });

      if (!template) {
        return { success: false, error: "Template không tồn tại" };
      }

      // Check access
      if (!template.isPublic && template.createdById !== userId) {
        return { success: false, error: "Không có quyền truy cập" };
      }

      return { success: true, template };
    } catch (error) {
      console.error("[getTemplateById] Error:", error);
      return { success: false, error: "Lỗi tải template" };
    }
  },

  /**
   * Create task from template
   */
  async createTaskFromTemplate(
    templateId: string,
    requestId: string,
    variables: Record<string, string>,
    userId: string
  ) {
    try {
      const template = await prisma.taskTemplate.findUnique({
        where: { id: templateId },
        include: {
          checklistItems: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });

      if (!template) {
        return { success: false, error: "Template không tồn tại" };
      }

      // Check access
      if (!template.isPublic && template.createdById !== userId) {
        return { success: false, error: "Không có quyền truy cập" };
      }

      // Replace variables in title and description
      let title = template.defaultTitle;
      let description = template.defaultDescription || "";

      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        title = title.replace(new RegExp(placeholder, "g"), value);
        description = description.replace(new RegExp(placeholder, "g"), value);
      });

      // Create task with checklist items
      const task = await prisma.task.create({
        data: {
          title,
          description,
          priority: template.defaultPriority,
          status: "TODO",
          requestId,
          createdFromTemplateId: templateId,
          checklistItems: {
            create: template.checklistItems.map((item, index) => ({
              title: item.title,
              description: item.description,
              order: index,
              isCompleted: false,
            })),
          },
        } as any,
        include: {
          checklistItems: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });

      // Update template usage
      await prisma.taskTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });

      return { success: true, task };
    } catch (error) {
      console.error("[createTaskFromTemplate] Error:", error);
      return { success: false, error: "Lỗi tạo task từ template" };
    }
  },

  /**
   * Create new template
   */
  async createTemplate(
    data: {
      name: string;
      description?: string;
      icon?: string;
      defaultTitle: string;
      defaultDescription?: string;
      defaultPriority: string;
      defaultCategoryId?: string;
      estimatedDays: number;
      isPublic: boolean;
      checklistItems: Array<{
        title: string;
        description?: string;
        order: number;
      }>;
    },
    userId: string
  ) {
    try {
      const template = await prisma.taskTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          icon: data.icon || "📝",
          defaultTitle: data.defaultTitle,
          defaultDescription: data.defaultDescription,
          defaultPriority: data.defaultPriority as any,
          defaultCategoryId: data.defaultCategoryId,
          estimatedDays: data.estimatedDays,
          isPublic: data.isPublic,
          createdById: userId,
          checklistItems: {
            create: data.checklistItems.map((item) => ({
              title: item.title,
              description: item.description,
              order: item.order,
            })),
          },
        },
        include: {
          checklistItems: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });

      return { success: true, template };
    } catch (error) {
      console.error("[createTemplate] Error:", error);
      return { success: false, error: "Lỗi tạo template" };
    }
  },

  /**
   * Update checklist item completion
   */
  async updateChecklistItem(
    itemId: string,
    isCompleted: boolean,
    userId: string
  ) {
    try {
      const item = await prisma.taskChecklistItem.update({
        where: { id: itemId },
        data: {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          completedBy: isCompleted ? userId : null,
        },
      });

      return { success: true, item };
    } catch (error) {
      console.error("[updateChecklistItem] Error:", error);
      return { success: false, error: "Lỗi cập nhật checklist" };
    }
  },

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string, userId: string) {
    try {
      const template = await prisma.taskTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return { success: false, error: "Template không tồn tại" };
      }

      // Only creator can delete
      if (template.createdById !== userId) {
        return { success: false, error: "Không có quyền xóa" };
      }

      await prisma.taskTemplate.delete({
        where: { id: templateId },
      });

      return { success: true };
    } catch (error) {
      console.error("[deleteTemplate] Error:", error);
      return { success: false, error: "Lỗi xóa template" };
    }
  },
};
