"use server";

import { auth } from "@/lib/auth";
import { templateService } from "@/lib/services/template-service";
import { revalidatePath } from "next/cache";

export async function getTemplates(categoryId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = session.user.id;
    return await templateService.getTemplates(userId, categoryId);
  } catch (error) {
    console.error("[getTemplates]:", error);
    return { success: false, error: "Lỗi tải templates" };
  }
}

export async function getTemplateById(templateId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = session.user.id;
    return await templateService.getTemplateById(templateId, userId);
  } catch (error) {
    console.error("[getTemplateById]:", error);
    return { success: false, error: "Lỗi tải template" };
  }
}

export async function createTaskFromTemplate(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const templateId = formData.get("templateId") as string;
    const requestId = formData.get("requestId") as string;
    const variablesJson = formData.get("variables") as string;

    const variables = variablesJson ? JSON.parse(variablesJson) : {};

    const result = await templateService.createTaskFromTemplate(
      templateId,
      requestId,
      variables,
      session.user.id
    );

    if (result.success) {
      revalidatePath("/requests");
      revalidatePath(`/requests/${requestId}`);
    }

    return result;
  } catch (error) {
    console.error("[createTaskFromTemplate]:", error);
    return { success: false, error: "Lỗi tạo task từ template" };
  }
}

export async function createTemplate(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      icon: formData.get("icon") as string,
      defaultTitle: formData.get("defaultTitle") as string,
      defaultDescription: formData.get("defaultDescription") as string,
      defaultPriority: formData.get("defaultPriority") as string,
      defaultCategoryId: formData.get("defaultCategoryId") as string,
      estimatedDays: parseInt(formData.get("estimatedDays") as string) || 3,
      isPublic: formData.get("isPublic") === "true",
      checklistItems: JSON.parse(formData.get("checklistItems") as string || "[]"),
    };

    const result = await templateService.createTemplate(data, session.user.id);

    if (result.success) {
      revalidatePath("/templates");
    }

    return result;
  } catch (error) {
    console.error("[createTemplate]:", error);
    return { success: false, error: "Lỗi tạo template" };
  }
}

export async function updateChecklistItem(
  itemId: string,
  isCompleted: boolean
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }
    const userId = session.user.id;

    const result = await templateService.updateChecklistItem(
      itemId,
      isCompleted,
      userId
    );

    if (result.success) {
      revalidatePath("/my-tasks");
      revalidatePath("/requests");
    }

    return result;
  } catch (error) {
    console.error("[updateChecklistItem]:", error);
    return { success: false, error: "Lỗi cập nhật checklist" };
  }
}

export async function deleteTemplate(templateId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const result = await templateService.deleteTemplate(
      templateId,
      session.user.id
    );

    if (result.success) {
      revalidatePath("/templates");
    }

    return result;
  } catch (error) {
    console.error("[deleteTemplate]:", error);
    return { success: false, error: "Lỗi xóa template" };
  }
}

export async function duplicateTemplate(templateId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    // Get original template
    const original = await templateService.getTemplateById(
      templateId,
      session.user.id
    );

    if (!original.success || !original.template) {
      return { success: false, error: original.error || "Template không tồn tại" };
    }

    const template = original.template;

    // Create duplicate with new name
    const result = await templateService.createTemplate(
      {
        name: `${template.name} (Copy)`,
        description: template.description || "",
        icon: template.icon || "📋",
        defaultTitle: template.defaultTitle || "",
        defaultDescription: template.defaultDescription || "",
        defaultPriority: template.defaultPriority || "MEDIUM",
        defaultCategoryId: template.defaultCategoryId || "",
        estimatedDays: template.estimatedDays || 3,
        isPublic: false, // Copies are private by default
        checklistItems: template.checklistItems?.map((item: any, index: number) => ({
          title: item.title,
          order: index,
        })) || [],
      },
      session.user.id
    );

    if (result.success) {
      revalidatePath("/templates");
    }

    return result;
  } catch (error) {
    console.error("[duplicateTemplate]:", error);
    return { success: false, error: "Lỗi nhân bản template" };
  }
}
