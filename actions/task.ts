'use server';

import { prisma } from '@/lib/prisma';
import { Prisma, TaskStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { dashboardService } from '@/lib/services/dashboard-service';
import { notificationService } from '@/lib/services/notification-service';

export async function getMyTasks(filters: {
  status: string;
  priority: string;
  search: string;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  const userId = session.user.id;
  
  const where: any = {
    assigneeId: userId,
  };
  
  // Apply filters
  if (filters.status !== 'all') {
    where.status = filters.status;
  }
  
  if (filters.priority !== 'all') {
    where.request = {
      priority: filters.priority,
    };
  }
  
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      {
        request: {
          title: { contains: filters.search, mode: 'insensitive' },
        },
      },
    ];
  }
  
  const tasks = await prisma.task.findMany({
    where,
    include: {
      request: {
        select: {
          id: true,
          title: true,
          priority: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { status: 'asc' },
      { deadline: 'asc' },
    ],
  });
  
  return tasks;
}

export async function updateTaskStatus(taskId: string, newStatus: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  const userId = session.user.id;
  
  // Verify task ownership
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { 
      assigneeId: true, 
      status: true,
      parentTaskId: true,
    },
  });
  
  if (!task || task.assigneeId !== session.user.id) {
    throw new Error('Không có quyền cập nhật nhiệm vụ này');
  }
  
  // Validation: Cannot mark parent task as DONE if subtasks are not all done
  if (newStatus === 'DONE' && !task.parentTaskId) {
    // This is a parent task (or standalone task), check for subtasks
    const subtasks = await prisma.task.findMany({
      where: { parentTaskId: taskId },
      select: { status: true },
    });
    
    if (subtasks.length > 0) {
      // Has subtasks, check if all are DONE
      const allSubtasksDone = subtasks.every(subtask => subtask.status === 'DONE');
      
      if (!allSubtasksDone) {
        throw new Error('Hoàn thành các subtask trước khi đánh dấu task này là DONE');
      }
    }
  }
  
  // Update task
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus as any,
      ...(newStatus === 'IN_PROGRESS' && { startedAt: new Date() }),
      ...(newStatus === 'DONE' && { completedAt: new Date() }),
    },
  });
  
  // Update user stats if task is completed
  if (newStatus === 'DONE' && task.assigneeId) {
    await dashboardService.updateUserStats(task.assigneeId, taskId);
  }
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      entity: 'Task',
      entityId: taskId,
      action: 'UPDATE',
      userId,
      oldValue: ({ status: task.status } as unknown) as Prisma.InputJsonValue,
      newValue: ({ status: newStatus } as unknown) as Prisma.InputJsonValue,
      taskId: taskId,
    },
  });
  
  revalidatePath('/my-tasks');
  revalidatePath('/personal');
  revalidatePath('/achievements');
  
  return updatedTask;
}

export async function updateTaskStatusAction(formData: FormData): Promise<void> {
  const taskId = formData.get('taskId') as string;
  const status = formData.get('status') as string;
  
  if (!taskId || !status) {
    throw new Error('Missing required fields');
  }
  
  await updateTaskStatus(taskId, status);
}

export async function assignTaskAction(formData: FormData): Promise<void> {
  const taskId = formData.get('taskId') as string;
  const assigneeId = formData.get('assigneeId') as string;
  
  if (!taskId || !assigneeId) {
    throw new Error('Missing required fields');
  }
  
  await assignTask(taskId, assigneeId);
}

export async function assignTask(taskId: string, assigneeId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  const userId = session.user.id;
  const userRole = (session.user as any).role;

  // === PERMISSION CHECK: Only Admin or Leader can assign tasks ===
  if (userRole !== 'ADMIN' && userRole !== 'LEADER') {
    throw new Error('Chỉ Admin hoặc Leader mới được phân công công việc');
  }

  // Get task with request and team info for validation
  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      request: {
        select: {
          id: true,
          title: true,
          teamId: true,
          team: {
            select: { leaderId: true, members: { select: { id: true } } },
          },
        },
      },
    },
  });

  if (!existingTask) {
    throw new Error('Task không tồn tại');
  }

  // === LEADER CHECK: Can only assign tasks in their team ===
  if (userRole === 'LEADER') {
    const isLeaderOfTeam = existingTask.request?.team?.leaderId === userId;
    if (!isLeaderOfTeam) {
      throw new Error('Bạn chỉ có thể phân công công việc trong team của mình');
    }
  }

  // === ASSIGNEE VALIDATION: Must be a team member ===
  if (existingTask.request?.teamId) {
    const teamMemberIds = existingTask.request.team?.members?.map(m => m.id) || [];
    const leaderId = existingTask.request.team?.leaderId;
    const validAssignees = [...teamMemberIds, leaderId].filter(Boolean);

    if (!validAssignees.includes(assigneeId)) {
      throw new Error('Người được giao phải là thành viên của team phụ trách yêu cầu này');
    }
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      entity: 'Task',
      entityId: taskId,
      action: 'UPDATE',
      userId,
      newValue: ({ assigneeId } as unknown) as Prisma.InputJsonValue,
      taskId: taskId,
    },
  });

  // === NOTIFY ASSIGNEE ===
  if (assigneeId && assigneeId !== userId) {
    const assignerName = (session.user as any).name || 'Admin/Leader';
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        type: 'TASK_ASSIGNED',
        title: '📋 Bạn được giao công việc mới',
        message: `${assignerName} đã giao cho bạn công việc "${task.title}".`,
        taskId: task.id,
        requestId: existingTask.request?.id,
        link: existingTask.request?.id ? `/requests/${existingTask.request.id}` : '/my-tasks',
      },
    });
  }

  revalidatePath('/my-tasks');
  revalidatePath('/requests');
  if (existingTask.request?.id) {
    revalidatePath(`/requests/${existingTask.request.id}`);
  }

  return task;
}

export async function createTaskForRequest(requestId: string, taskData: {
  title: string;
  description?: string;
  deadline?: Date;
  assigneeId?: string;
}) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }
    const userId = session.user.id;

    // Get request with team info to notify leader
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        team: {
          select: {
            leaderId: true,
            name: true,
          },
        },
      },
    });

    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    const task = await prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description || null,
        deadline: taskData.deadline || null,
        assigneeId: taskData.assigneeId || null,
        requestId: requestId,
        status: TaskStatus.TODO,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Task',
        entityId: task.id,
        action: 'CREATE',
        userId,
        newValue: ({ title: task.title, requestId, assigneeId: taskData.assigneeId } as unknown) as Prisma.InputJsonValue,
        taskId: task.id,
      },
    });

    // If assigneeId is provided, notify Leader (if exists and not the creator)
    if (taskData.assigneeId && request.team?.leaderId && request.team.leaderId !== userId) {
      const assignee = await prisma.user.findUnique({
        where: { id: taskData.assigneeId },
        select: { name: true },
      });

      await prisma.notification.create({
        data: {
          userId: request.team.leaderId,
          type: 'TASK_UPDATED' as any,
          title: 'Nhiệm vụ mới đã được giao',
          message: `Nhiệm vụ "${task.title}" đã được giao cho ${assignee?.name || 'người dùng'}. Vui lòng kiểm tra và xác nhận.`,
          requestId: requestId,
          taskId: task.id,
        },
      });
    }

    // NOTIFY ASSIGNEE: Send notification to the assigned person
    if (taskData.assigneeId) {
      try {
        await notificationService.notifyTaskAssigned(
          requestId,
          taskData.assigneeId,
          task.title
        );
        console.log(`[createTaskForRequest] Notification sent to assignee for task: ${task.title}`);
      } catch (notifError) {
        console.error("[createTaskForRequest] Failed to send notification to assignee:", notifError);
        // Don't fail the task creation if notification fails
      }
    }

    revalidatePath(`/requests/${requestId}`);
    revalidatePath('/my-tasks');

    return { success: true, task };
    
  } catch (error) {
    console.error('[createTaskForRequest] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create task' 
    };
  }
}

export async function updateTaskPriority(taskId: string, priority: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }
    const userId = session.user.id;

    // Verify task ownership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { assigneeId: true, requestId: true },
    });

    if (!task) {
      return { success: false, error: "Không tìm thấy task" };
    }

    if (task.assigneeId !== session.user.id && (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Không có quyền cập nhật" };
    }

    // Update request priority (tasks don't have priority field, but request does)
    if (task.requestId) {
      await prisma.request.update({
        where: { id: task.requestId },
        data: { priority: priority as any },
      });
    }

    await prisma.auditLog.create({
      data: {
        entity: "Task",
        entityId: taskId,
        action: "UPDATE",
        userId,
        newValue: ({ field: "priority", newValue: priority } as unknown) as Prisma.InputJsonValue,
        taskId: taskId,
      },
    });

    revalidatePath("/my-tasks");
    if (task.requestId) revalidatePath(`/requests/${task.requestId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Lỗi cập nhật priority" };
  }
}

export async function deleteTask(taskId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }
    const userId = session.user.id;

    // Check permission
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { assigneeId: true, requestId: true },
    });

    if (!task) {
      return { success: false, error: "Không tìm thấy task" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && task.assigneeId !== session.user.id) {
      return { success: false, error: "Không có quyền xóa" };
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    await prisma.auditLog.create({
      data: {
        entity: "Task",
        entityId: taskId,
        action: "DELETE",
        userId,
        newValue: ({} as unknown) as Prisma.InputJsonValue,
        taskId: taskId,
      },
    });

    revalidatePath("/my-tasks");
    if (task.requestId) revalidatePath(`/requests/${task.requestId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Lỗi xóa task" };
  }
}

/**
 * Submit task deliverable - nộp kết quả công việc
 * 
 * Workflow:
 * 1. Validate task và user (phải là assignee)
 * 2. Tạo attachments từ files
 * 3. Tạo comment với nội dung
 * 4. Update task status thành IN_REVIEW
 * 5. Create audit log
 */
export async function submitTaskDeliverable(args: {
  taskId: string;
  comment: string;
  files?: Array<{ name: string; url: string; size: number; type: string; method?: string }>;
  links?: Array<{ url: string; label?: string }>;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: "Chưa đăng nhập" };
  }

  const userId = session.user.id;

  try {
    // Validate task và check permission
    const task = await prisma.task.findUnique({
      where: { id: args.taskId },
      select: {
        id: true,
        assigneeId: true,
        status: true,
        requestId: true,
      },
    });

    if (!task) {
      return { success: false, error: "Không tìm thấy công việc" };
    }

    // Chỉ assignee mới được nộp kết quả
    if (task.assigneeId !== userId) {
      return { success: false, error: "Chỉ người được giao mới có thể nộp kết quả" };
    }

    // Chỉ cho phép nộp khi task ở trạng thái TODO hoặc IN_PROGRESS
    if (task.status !== "TODO" && task.status !== "IN_PROGRESS") {
      return { success: false, error: `Không thể nộp kết quả khi task ở trạng thái ${task.status}` };
    }

    const files = args.files ?? [];
    const links = args.links ?? [];

    // Validate input
    if (!args.comment || args.comment.trim().length < 20) {
      return { success: false, error: "Ghi chú phải có ít nhất 20 ký tự" };
    }

    if (files.length === 0 && links.length === 0) {
      return { success: false, error: "Vui lòng tải lên file hoặc nhập link sản phẩm" };
    }

    if (files.length > 3) {
      return { success: false, error: "Chỉ được tải lên tối đa 3 file" };
    }

    if (links.length > 3) {
      return { success: false, error: "Chỉ được nhập tối đa 3 link" };
    }

    for (const link of links) {
      try {
        new URL(link.url);
      } catch {
        return { success: false, error: "Link không hợp lệ. Vui lòng nhập URL đầy đủ" };
      }
    }

    // Transaction: tạo attachments, comment, update task status
    await prisma.$transaction(async (tx) => {
      // 1. Tạo attachments
      const attachmentPayload: Prisma.AttachmentCreateManyInput[] = [];

      if (files.length > 0) {
        attachmentPayload.push(
          ...files.map((file) => ({
            taskId: task.id,
            fileName: file.name,
            fileSize: file.size || 0,
            mimeType: file.type || "application/octet-stream",
            fileUrl: file.url,
            uploadMethod: (file.method?.toUpperCase() as any) || "FILE",
            uploadedById: userId,
            scanStatus: "PENDING" as const,
          }))
        );
      }

      if (links.length > 0) {
        attachmentPayload.push(
          ...links.map((link, index) => {
            const url = new URL(link.url);
            const hostname = url.hostname.replace(/^www\./, "");
            const label = link.label || `Link ${index + 1}`;
            return {
              taskId: task.id,
              fileName: `${label} (${hostname})`,
              fileSize: 0,
              mimeType: "text/html",
              externalUrl: link.url,
              uploadMethod: "URL" as const,
              uploadedById: userId,
              scanStatus: "SKIPPED" as const,
            } satisfies Prisma.AttachmentCreateManyInput;
          })
        );
      }

      if (attachmentPayload.length > 0) {
        await tx.attachment.createMany({
          data: attachmentPayload,
        });
      }

      // 2. Tạo comment
      await tx.comment.create({
        data: {
          taskId: task.id,
          content: args.comment.trim(),
          authorId: userId,
        },
      });

      // 3. Update task status thành IN_REVIEW
      await tx.task.update({
        where: { id: task.id },
        data: {
          status: "IN_REVIEW",
        },
      });

      // 4. Create audit log
      await tx.auditLog.create({
        data: {
          entity: "Task",
          entityId: task.id,
          action: "SUBMIT_DELIVERABLE",
          userId,
          oldValue: ({ status: task.status } as unknown) as Prisma.InputJsonValue,
          newValue: ({
            status: "IN_REVIEW",
            filesCount: files.length,
            linksCount: links.length,
          } as unknown) as Prisma.InputJsonValue,
        },
      });
    });

  // Revalidate paths
  revalidatePath("/my-tasks");
  revalidatePath(`/my-tasks/${args.taskId}`);
  if (task.requestId) {
    revalidatePath(`/requests/${task.requestId}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/personal");

    return { success: true };
  } catch (error) {
    console.error("[submitTaskDeliverable]:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Lỗi nộp kết quả công việc" 
    };
  }
}

/**
 * Submit product link - nộp link sản phẩm
 * 
 * Workflow:
 * 1. Validate user is assignee
 * 2. Validate URL format
 * 3. Validate task status (IN_PROGRESS or DONE)
 * 4. Update Task with productLink
 * 5. Update task status → IN_REVIEW
 * 6. Create comment
 * 7. Send notifications to Leader/Requester
 */
export async function submitProductLink(args: {
  taskId: string;
  productLink: string;
  comment?: string;
  files?: Array<{ name: string; url: string; size: number; type: string; method?: string }>;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: "Chưa đăng nhập" };
  }

  const userId = session.user.id;

  try {
    // Validate URL format
    try {
      new URL(args.productLink);
    } catch {
      return { success: false, error: "URL không hợp lệ" };
    }

    // Validate task và check permission
    const task = await prisma.task.findUnique({
      where: { id: args.taskId },
      include: {
        request: {
          select: {
            id: true,
            status: true,
            creatorId: true,
            teamId: true,
            team: {
              select: {
                leaderId: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Không tìm thấy công việc" };
    }

    // Chỉ assignee mới được nộp link
    if (task.assigneeId !== userId) {
      return { success: false, error: "Chỉ người được giao mới có thể nộp link sản phẩm" };
    }

    // Chỉ cho phép nộp khi task ở trạng thái IN_PROGRESS, DONE, REWORK, hoặc BLOCKED (làm rõ/review lại)
    // Hoặc khi Request ở trạng thái CLARIFICATION (làm rõ)
    const allowedTaskStatuses = ["IN_PROGRESS", "DONE", "REWORK", "BLOCKED"];
    const isRequestClarification = task.request?.status === "CLARIFICATION";
    
    if (!allowedTaskStatuses.includes(task.status) && !isRequestClarification) {
      return { success: false, error: `Chỉ có thể nộp link khi task ở trạng thái IN_PROGRESS, DONE, REWORK, BLOCKED, hoặc khi Request ở trạng thái CLARIFICATION (làm rõ)` };
    }

    // Validate comment nếu có
    if (args.comment && args.comment.trim().length < 20) {
      return { success: false, error: "Ghi chú phải có ít nhất 20 ký tự" };
    }

    // Check if this is a resubmission after rejection
    const isResubmission = task.productLinkReviewStatus === "REJECTED";
    const rejectionCount = (task as any).productLinkRejectionCount || 0;

    // Transaction: update task, create comment, send notifications
    await prisma.$transaction(async (tx) => {
      // Update task with product link
      // If resubmitting after rejection, reset review status to PENDING
      await tx.task.update({
        where: { id: task.id },
        data: {
          productLink: args.productLink,
          productLinkSubmittedAt: new Date(),
          productLinkSubmittedBy: userId,
          productLinkReviewStatus: "PENDING",
          status: "IN_REVIEW",
          // Reset rejection comment when resubmitting
          productLinkReviewComment: isResubmission ? null : undefined,
        },
      });

      const files = args.files ?? [];
      if (files.length > 0) {
        await tx.attachment.createMany({
          data: files.map((file) => ({
            taskId: task.id,
            fileName: file.name,
            fileSize: file.size || 0,
            mimeType: file.type || "application/octet-stream",
            fileUrl: file.url,
            uploadMethod: (file.method?.toUpperCase() as any) || "FILE",
            uploadedById: userId,
            scanStatus: "PENDING" as const,
          })),
        });
      }

      // Create comment
      const commentContent = isResubmission
        ? `🔄 Đã nộp lại link sản phẩm (lần ${rejectionCount + 1}):\n${args.productLink}${args.comment ? `\n\nGhi chú: ${args.comment.trim()}` : ""}`
        : `🔗 Đã nộp link sản phẩm:\n${args.productLink}${args.comment ? `\n\nGhi chú: ${args.comment.trim()}` : ""}`;
      
      await tx.comment.create({
        data: {
          taskId: task.id,
          content: commentContent,
          authorId: userId,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          entity: "Task",
          entityId: task.id,
          action: "SUBMIT_PRODUCT_LINK",
          userId,
          newValue: ({
            productLink: args.productLink,
            status: "IN_REVIEW",
            filesCount: files.length,
          } as unknown) as Prisma.InputJsonValue,
        },
      });

      // Send notifications to Leader and Requester
      const notificationRecipients: string[] = [];
      
      if (task.request.team?.leaderId) {
        notificationRecipients.push(task.request.team.leaderId);
      }
      
      if (task.request.creatorId && task.request.creatorId !== userId) {
        notificationRecipients.push(task.request.creatorId);
      }

      // Remove duplicates
      const uniqueRecipients = [...new Set(notificationRecipients)];

      if (uniqueRecipients.length > 0) {
        await tx.notification.createMany({
          data: uniqueRecipients.map((recipientId) => ({
            userId: recipientId,
            type: "REVIEW_NEEDED",
            title: "Link sản phẩm đã được nộp",
            message: `Task "${task.title}" đã có link sản phẩm cần duyệt`,
            link: `/my-tasks/${task.id}`,
            priority: "INFO",
            taskId: task.id,
            requestId: task.requestId,
          })),
        });
      }
    });

  // Revalidate paths
  revalidatePath("/my-tasks");
  revalidatePath(`/my-tasks/${args.taskId}`);
  if (task.requestId) {
    revalidatePath(`/requests/${task.requestId}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/personal");

    return { success: true };
  } catch (error) {
    console.error("[submitProductLink]:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Lỗi nộp link sản phẩm" 
    };
  }
}

/**
 * Approve product link - duyệt link sản phẩm
 *
 * Workflow 2 bước (TWO-STEP APPROVAL):
 * 1. Leader duyệt → status = "LEADER_APPROVED" (chờ Requester duyệt)
 * 2. Requester duyệt → status = "APPROVED", task = DONE
 *
 * ADMIN BEHAVIOR:
 * - Admin có thể thực hiện THAY thế Leader (bước 1) hoặc Requester (bước 2)
 * - Admin vẫn phải thực hiện ĐỦ 2 bước, không thể skip trực tiếp sang DONE
 * - Đây là design decision để đảm bảo accountability và audit trail
 *
 * SPECIAL CASE - Leader là Requester:
 * - Nếu Leader cũng là người tạo request, chỉ cần 1 bước duyệt → DONE
 *
 * Steps:
 * 1. Validate user can review (Leader/Requester/Admin)
 * 2. Validate productLinkReviewStatus
 * 3. Update Task based on reviewer role
 * 4. Create comment
 * 5. Send notification
 */
export async function approveProductLink(args: {
  taskId: string;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: "Chưa đăng nhập" };
  }

  const userId = session.user.id;

  try {
    const task = await prisma.task.findUnique({
      where: { id: args.taskId },
      include: {
        request: {
          select: {
            creatorId: true,
            teamId: true,
            team: {
              select: {
                leaderId: true,
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Không tìm thấy công việc" };
    }

    if (!task.productLink) {
      return { success: false, error: "Task chưa có link sản phẩm" };
    }

    // Check permission: Leader, Requester, or Admin
    const userRole = (session.user as any).role;
    const isLeader = task.request.team?.leaderId === userId;
    const isRequester = task.request.creatorId === userId;
    const isAdmin = userRole === "ADMIN";
    const leaderIsRequester = isLeader && isRequester;

    if (!isLeader && !isRequester && !isAdmin) {
      return { success: false, error: "Chỉ Leader, người yêu cầu hoặc Admin mới có thể duyệt" };
    }

    // Determine review step
    const currentStatus = task.productLinkReviewStatus;
    let newStatus: string;
    let taskStatus: string;
    let isFinalApproval = false;

    let mergedFinalApproval = false;

    if (currentStatus === "PENDING") {
      // Step 1: Leader duyệt
      if (!isLeader && !isAdmin) {
        return { success: false, error: "Chỉ Leader hoặc Admin mới có thể duyệt bước đầu" };
      }
      if (leaderIsRequester) {
        newStatus = "APPROVED";
        taskStatus = "DONE";
        isFinalApproval = true;
        mergedFinalApproval = true;
      } else {
        newStatus = "LEADER_APPROVED";
        taskStatus = "IN_REVIEW"; // Vẫn chờ Requester duyệt
      }
    } else if (currentStatus === "LEADER_APPROVED") {
      // Step 2: Requester duyệt
      if (!isRequester && !isAdmin) {
        return { success: false, error: "Chỉ người yêu cầu hoặc Admin mới có thể duyệt bước cuối" };
      }
      newStatus = "APPROVED";
      taskStatus = "DONE";
      isFinalApproval = true;
    } else {
      return { success: false, error: "Link sản phẩm không ở trạng thái có thể duyệt" };
    }

    // Transaction
    await prisma.$transaction(async (tx) => {
      // Update task
      const updateData: any = {
        productLinkReviewStatus: newStatus,
        productLinkReviewedAt: new Date(),
        productLinkReviewedBy: userId,
        status: taskStatus,
      };

      if (isFinalApproval) {
        updateData.completedAt = new Date();
      }

      await tx.task.update({
        where: { id: task.id },
        data: updateData,
      });

      // Create comment
      const approverName = session.user?.name || "Admin";
      const commentText = isFinalApproval
        ? mergedFinalApproval
          ? `✅ Link sản phẩm đã được duyệt hoàn toàn bởi ${approverName} (Leader & Người yêu cầu)`
          : `✅ Link sản phẩm đã được duyệt hoàn toàn bởi ${approverName}`
        : `✅ Link sản phẩm đã được Leader duyệt bởi ${approverName}. Đang chờ người yêu cầu duyệt.`;

      await tx.comment.create({
        data: {
          taskId: task.id,
          content: commentText,
          authorId: userId,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          entity: "Task",
          entityId: task.id,
          action: "APPROVE_PRODUCT_LINK",
          userId,
          oldValue: ({ productLinkReviewStatus: currentStatus, status: task.status } as unknown) as Prisma.InputJsonValue,
          newValue: ({ productLinkReviewStatus: newStatus, status: taskStatus } as unknown) as Prisma.InputJsonValue,
        },
      });

      // Send notifications
      if (isFinalApproval) {
        // Notify assignee
        if (task.assigneeId && task.assigneeId !== userId) {
          await tx.notification.create({
            data: {
              userId: task.assigneeId,
              type: "COMPLETED",
              title: "Link sản phẩm đã được duyệt hoàn toàn",
              message: `Task "${task.title}" đã được duyệt và hoàn thành`,
              link: `/my-tasks/${task.id}`,
              priority: "INFO",
              taskId: task.id,
              requestId: task.requestId,
            },
          });
        }
      } else {
        // Notify Requester
        if (task.request.creatorId && task.request.creatorId !== userId) {
          await tx.notification.create({
            data: {
              userId: task.request.creatorId,
              type: "REVIEW_NEEDED",
              title: "Link sản phẩm cần bạn duyệt",
              message: `Task "${task.title}" đã được Leader duyệt, cần bạn duyệt bước cuối`,
              link: `/requests/${task.requestId}`,
              priority: "INFO",
              taskId: task.id,
              requestId: task.requestId,
            },
          });
        }
      }
    });

    // Revalidate paths
    revalidatePath("/my-tasks");
    revalidatePath(`/my-tasks/${args.taskId}`);
    if (task.requestId) {
      revalidatePath(`/requests/${task.requestId}`);
    }
    revalidatePath("/dashboard");
    revalidatePath("/personal");

    return { success: true };
  } catch (error) {
    console.error("[approveProductLink]:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Lỗi duyệt link sản phẩm" 
    };
  }
}

/**
 * Update task - Chỉnh sửa task sau khi đã giao
 * 
 * Logic:
 * - Fixed task (createdFromTemplateId): CHỈ cho sửa description, KHÔNG cho sửa deadline → KHÔNG cần Leader duyệt
 * - Custom task: Cho sửa full (title, description, deadline, assigneeId). Nếu có thay đổi deadline → thông báo Leader (để biết, không chặn)
 * 
 * Permissions:
 * - Admin: có thể sửa mọi task
 * - Assignee: có thể sửa task của mình
 * - Leader của team: có thể sửa task của team mình
 * - Request creator: có thể sửa task của request mình
 */
export async function updateTaskAction(taskId: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { ok: false, message: "Chưa đăng nhập" };
    }

    const userId = session.user.id as string;
    const userRole = (session.user as any).role as string;

    // Get current task with request info
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        request: {
          select: {
            id: true,
            creatorId: true,
            teamId: true,
            team: {
              select: {
                leaderId: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!currentTask) {
      return { ok: false, message: "Task không tồn tại" };
    }

    // Permission check
    const isAdmin = userRole === "ADMIN";
    const isAssignee = currentTask.assigneeId === userId;
    const isLeader = currentTask.request.team?.leaderId === userId;
    const isCreator = currentTask.request.creatorId === userId;

    if (!isAdmin && !isAssignee && !isLeader && !isCreator) {
      return { ok: false, message: "Bạn không có quyền chỉnh sửa task này" };
    }

    const isFixedTask = !!currentTask.createdFromTemplateId;

    // Parse form data
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const deadlineStr = formData.get("deadline") as string | null;
    const assigneeId = formData.get("assigneeId") as string | null;

    // Validation
    if (!title || title.trim().length < 5) {
      return { ok: false, message: "Tiêu đề phải có ít nhất 5 ký tự" };
    }

    const updateData: any = {
      title: title.trim(),
      description: description?.trim() || null,
    };

    // Fixed task: CHỈ cho sửa description, KHÔNG cho sửa deadline
    if (isFixedTask) {
      // Only update description, ignore deadline changes
      // Note: We don't allow changing deadline for fixed tasks
    } else {
      // Custom task: Cho sửa full
      if (deadlineStr) {
        const deadlineDate = new Date(deadlineStr);
        if (isNaN(deadlineDate.getTime())) {
          return { ok: false, message: "Deadline không hợp lệ" };
        }
        updateData.deadline = deadlineDate;
      } else {
        updateData.deadline = null;
      }

      if (assigneeId) {
        // Validate assignee exists and is in the team
        const assignee = await prisma.user.findUnique({
          where: { id: assigneeId },
          select: { id: true, teamId: true },
        });

        if (!assignee) {
          return { ok: false, message: "Người được giao không tồn tại" };
        }

        // If request has a team, verify assignee is in that team
        if (currentTask.request.teamId && assignee.teamId !== currentTask.request.teamId) {
          return { ok: false, message: "Người được giao phải thuộc team được giao xử lý request" };
        }

        updateData.assigneeId = assigneeId;
      } else {
        updateData.assigneeId = null;
      }
    }

    // Check if deadline changed (for custom tasks only)
    const oldDeadline = currentTask.deadline;
    const newDeadline = updateData.deadline;
    const deadlineChanged = isFixedTask 
      ? false 
      : (oldDeadline?.getTime() !== newDeadline?.getTime());

    // Update task
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entity: "Task",
        entityId: taskId,
        taskId: taskId,
        requestId: currentTask.requestId,
        oldValue: ({
          title: currentTask.title,
          description: currentTask.description,
          deadline: currentTask.deadline,
          assigneeId: currentTask.assigneeId,
        } as unknown) as Prisma.InputJsonValue,
        newValue: ({
          title: updated.title,
          description: updated.description,
          deadline: updated.deadline,
          assigneeId: updated.assigneeId,
        } as unknown) as Prisma.InputJsonValue,
      },
    });

    // If custom task and deadline changed, notify Leader (if exists)
    if (!isFixedTask && deadlineChanged && currentTask.request.team?.leaderId) {
      const leaderId = currentTask.request.team.leaderId;

      // Don't notify if the updater is the leader themselves
      if (leaderId !== userId) {
        await prisma.notification.create({
          data: {
            userId: leaderId,
            type: "TASK_UPDATED" as any,
            title: "Task đã được chỉnh sửa",
            message: `Task "${updated.title}" đã được chỉnh sửa deadline. Vui lòng kiểm tra lại.`,
            requestId: currentTask.requestId,
            taskId: taskId,
          },
        });
      }
    }

    // NOTIFY NEW ASSIGNEE: If assignee changed, notify the new assignee
    const assigneeChanged = currentTask.assigneeId !== updated.assigneeId;
    if (assigneeChanged && updated.assigneeId) {
      try {
        await notificationService.notifyTaskAssigned(
          currentTask.requestId,
          updated.assigneeId,
          updated.title
        );
        console.log(`[updateTaskAction] Notification sent to new assignee for task: ${updated.title}`);
      } catch (notifError) {
        console.error("[updateTaskAction] Failed to send notification to new assignee:", notifError);
        // Don't fail the update if notification fails
      }
    }

    revalidatePath(`/requests/${currentTask.requestId}`);
    revalidatePath("/my-tasks");
    revalidatePath("/dashboard");

    return { ok: true, message: "Cập nhật task thành công" };
  } catch (error) {
    console.error("[updateTaskAction]:", error);
    return { ok: false, message: error instanceof Error ? error.message : "Lỗi cập nhật task" };
  }
}

/**
 * Reject product link - từ chối link sản phẩm
 * 
 * Workflow:
 * 1. Validate user can review
 * 2. Validate productLinkReviewStatus = PENDING
 * 3. Validate comment (min 20 chars)
 * 4. Update Task: reject
 * 5. Update task status → REWORK
 * 6. Create comment with rejection reason
 * 7. Send notification to assignee
 */
export async function rejectProductLink(args: {
  taskId: string;
  comment: string;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: "Chưa đăng nhập" };
  }

  const userId = session.user.id;

  try {
    // Validate comment
    if (!args.comment || args.comment.trim().length < 20) {
      return { success: false, error: "Vui lòng nhập lý do từ chối (tối thiểu 20 ký tự)" };
    }

    const task = await prisma.task.findUnique({
      where: { id: args.taskId },
      include: {
        request: {
          select: {
            creatorId: true,
            teamId: true,
            team: {
              select: {
                leaderId: true,
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Không tìm thấy công việc" };
    }

    if (!task.productLink) {
      return { success: false, error: "Task chưa có link sản phẩm" };
    }

    const currentStatus = task.productLinkReviewStatus;
    if (currentStatus !== "PENDING" && currentStatus !== "LEADER_APPROVED") {
      return { success: false, error: "Link sản phẩm không ở trạng thái có thể từ chối" };
    }

    // Check permission
    const userRole = (session.user as any).role;
    const isLeader = task.request.team?.leaderId === userId;
    const isRequester = task.request.creatorId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isLeader && !isRequester && !isAdmin) {
      return { success: false, error: "Chỉ Leader, người yêu cầu hoặc Admin mới có thể từ chối" };
    }

    // Determine rejection context
    const isRequesterRejecting = isRequester && currentStatus === "LEADER_APPROVED";
    const rejectionMessage = isRequesterRejecting
      ? "Người yêu cầu từ chối, gửi lại cho Leader để review và phân công chỉnh sửa"
      : "Leader từ chối, cần nhân viên chỉnh sửa lại";

    // Check rejection count limit (max 3 times)
    const currentRejectionCount = (task as any).productLinkRejectionCount || 0;
    if (currentRejectionCount >= 3) {
      return { success: false, error: "Đã đạt giới hạn 3 lần từ chối. Vui lòng liên hệ Leader hoặc Admin để được hỗ trợ." };
    }

    // Transaction
    await prisma.$transaction(async (tx) => {
      // Update task
      await tx.task.update({
        where: { id: task.id },
        data: {
          productLinkReviewStatus: "REJECTED",
          productLinkReviewedAt: new Date(),
          productLinkReviewedBy: userId,
          productLinkReviewComment: args.comment.trim(),
          status: "REWORK",
          productLinkRejectionCount: { increment: 1 } as any,
        },
      });

      // Create comment
      const commentContent = `❌ Link sản phẩm bị từ chối bởi ${session.user?.name || "Admin"}\n\nLý do: ${args.comment.trim()}\n\n${rejectionMessage}`;
      await tx.comment.create({
        data: {
          taskId: task.id,
          content: commentContent,
          authorId: userId,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          entity: "Task",
          entityId: task.id,
          action: "REJECT_PRODUCT_LINK",
          userId,
          oldValue: ({ productLinkReviewStatus: "PENDING", status: task.status } as unknown) as Prisma.InputJsonValue,
          newValue: ({ productLinkReviewStatus: "REJECTED", status: "REWORK", comment: args.comment.trim() } as unknown) as Prisma.InputJsonValue,
        },
      });

      // Send notifications
      if (isRequesterRejecting) {
        // Requester từ chối → notify Leader
        if (task.request.team?.leaderId && task.request.team.leaderId !== userId) {
          await tx.notification.create({
            data: {
              userId: task.request.team.leaderId,
              type: "REVIEW_NEEDED",
              title: "Link sản phẩm bị từ chối bởi người yêu cầu",
              message: `Task "${task.title}" cần Leader review và phân công chỉnh sửa. Lý do: ${args.comment.trim()}`,
              link: `/requests/${task.requestId}`,
              priority: "WARNING",
              taskId: task.id,
              requestId: task.requestId,
            },
          });
        }
      } else {
        // Leader từ chối → notify assignee
        if (task.assigneeId && task.assigneeId !== userId) {
          await tx.notification.create({
            data: {
              userId: task.assigneeId,
              type: "TASK_UPDATED",
              title: "Link sản phẩm bị từ chối",
              message: `Task "${task.title}" cần được sửa lại. Lý do: ${args.comment.trim()}`,
              link: `/my-tasks/${task.id}`,
              priority: "WARNING",
              taskId: task.id,
              requestId: task.requestId,
            },
          });
        }
      }
    });

    // Revalidate paths
    revalidatePath("/my-tasks");
    revalidatePath(`/my-tasks/${args.taskId}`);
    if (task.requestId) {
      revalidatePath(`/requests/${task.requestId}`);
    }
    revalidatePath("/dashboard");
    revalidatePath("/personal");

    return { success: true };
  } catch (error) {
    console.error("[rejectProductLink]:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Lỗi từ chối link sản phẩm" 
    };
  }
}