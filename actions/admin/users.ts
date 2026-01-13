'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Role, Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

const addUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
  teamId: z.string().optional(),
  positionText: z.string().optional(),
  phone: z.string().optional(),
  telegramUsername: z.string().optional(),
  permissionTickets: z.array(z.string()).optional(),
});

export async function addUser(data: z.infer<typeof addUserSchema>) {
  try {
    const session = await auth();
    
    // Check authorization
    if (!session?.user || (session.user as any).role !== Role.ADMIN) {
      throw new Error('Không có quyền thực hiện hành động này');
    }
    
    // Validate input
    const validated = addUserSchema.parse(data);
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });
    
    if (existingUser) {
      throw new Error('Email đã được sử dụng');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: validated.role,
        teamId: validated.teamId || null,
        positionText: validated.positionText || null,
        phone: validated.phone || null,
        telegramUsername: validated.telegramUsername || null,
        permissionTickets: validated.permissionTickets || [],
        isActive: true,
      } as any, // Temporary type assertion until Prisma client fully regenerates
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teamId: true,
      isActive: true,
      createdAt: true,
    },
  });
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      newValue: ({
        name: user.name,
        email: user.email,
        role: user.role,
      } as unknown) as Prisma.InputJsonValue,
    },
  });
  
    // Revalidate paths
    revalidatePath('/admin/users');
    revalidatePath('/admin/users/[id]', 'page');
    
    return user;
  } catch (error) {
    console.error('[addUser] Error:', error);
    // Re-throw with better error message
    if (error instanceof z.ZodError) {
      throw new Error(`Dữ liệu không hợp lệ: ${error.issues.map((e: any) => e.message).join(', ')}`);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Lỗi không xác định khi tạo người dùng');
  }
}

export async function getUsers() {
  const session = await auth();
  
  if (!session?.user || ![Role.ADMIN, Role.LEADER].includes((session.user as any).role)) {
    throw new Error('Unauthorized');
  }
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  return users;
}

export async function createUser(data: z.infer<typeof addUserSchema>) {
  return addUser(data);
}

/**
 * Change user password (Admin only)
 */
export async function changeUserPassword(userId: string, newPassword: string) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== Role.ADMIN) {
      return { success: false, error: 'Không có quyền' };
    }

    // Validate password
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' };
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!existingUser) {
      return { success: false, error: 'Người dùng không tồn tại' };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword } as any,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'PASSWORD_CHANGED',
        entity: 'User',
        entityId: userId,
        newValue: ({
          changedBy: (session.user as any).name || (session.user as any).email,
          changedAt: new Date().toISOString(),
        } as unknown) as Prisma.InputJsonValue,
      },
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);

    return { success: true };
  } catch (error) {
    console.error('[changeUserPassword]:', error);
    return { success: false, error: 'Lỗi đổi mật khẩu' };
  }
}

export async function updateUser(
  userId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string | null;
    telegramUsername?: string | null;
    role?: Role;
    teamId?: string | null;
    positionText?: string | null;
    permissionTickets?: string[];
  }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== Role.ADMIN) {
      return { success: false, error: 'Không có quyền' };
    }

    // Check if user exists
    const existingUser = (await prisma.user.findUnique({
      where: { id: userId },
    })) as any;

    if (!existingUser) {
      return { success: false, error: 'Người dùng không tồn tại' };
    }

    // Check email uniqueness if changing email
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        return { success: false, error: 'Email đã được sử dụng' };
      }
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name ?? undefined,
        email: data.email ?? undefined,
        role: data.role ? data.role : undefined,
        teamId: data.teamId === undefined ? undefined : data.teamId,
        positionText: data.positionText === undefined ? undefined : data.positionText,
        phone: data.phone === undefined ? undefined : data.phone,
        telegramUsername: data.telegramUsername === undefined ? undefined : data.telegramUsername,
        permissionTickets: data.permissionTickets === undefined ? undefined : data.permissionTickets,
      } as any, // Temporary type assertion until Prisma client fully regenerates
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'USER_UPDATED',
        entity: 'User',
        entityId: userId,
        oldValue: {
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          permissionTickets: existingUser.permissionTickets ?? [],
        },
        newValue: ({
          name: data.name || existingUser.name,
          email: data.email || existingUser.email,
          role: data.role || existingUser.role,
          permissionTickets: data.permissionTickets ?? existingUser.permissionTickets ?? [],
        } as unknown) as Prisma.InputJsonValue,
      },
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    
    // Revalidate các path có thể sử dụng permissionTickets
    // User sẽ cần refresh page để nhận quyền mới (hoặc đăng nhập lại)
    revalidatePath('/dashboard');
    revalidatePath('/requests');

    // If updating permissionTickets, trigger session update for that user
    // Note: User will need to refresh page to get updated permissions
    // The JWT callback in lib/auth.ts will refresh permissionTickets from DB when trigger === "update"
    if (data.permissionTickets !== undefined) {
      // Revalidate all paths that might use this user's session
      revalidatePath('/', 'layout');
    }

    return { success: true };
  } catch (error) {
    console.error('[updateUser]:', error);
    return { success: false, error: 'Lỗi cập nhật user' };
  }
}

export async function toggleUserStatus(userId: string) {
  const session = await auth();
  
  if (!session?.user || (session.user as any).role !== Role.ADMIN) {
    throw new Error('Không có quyền thực hiện hành động này');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, isActive: true },
  });
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
    },
  });
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'USER_STATUS_TOGGLED',
      entity: 'User',
      entityId: userId,
      oldValue: { isActive: user.isActive },
      newValue: { isActive: !user.isActive },
    },
  });
  
  return updatedUser;
}

export async function deleteUser(userId: string) {
  const session = await auth();
  
  if (!session?.user || (session.user as any).role !== Role.ADMIN) {
    throw new Error('Không có quyền thực hiện hành động này');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  // Check if user has any requests or tasks
  const [requestsCount, tasksCount] = await Promise.all([
    prisma.request.count({ where: { creatorId: userId } }),
    prisma.task.count({ where: { assigneeId: userId } }),
  ]);
  
  if (requestsCount > 0 || tasksCount > 0) {
    throw new Error('Không thể xóa người dùng đã có yêu cầu hoặc công việc');
  }
  
  // Use transaction to delete all related data first, then the user
  await prisma.$transaction(async (tx) => {
    // Delete audit logs created by this user
    await tx.auditLog.deleteMany({
      where: { userId: userId },
    });
    
    // Delete comments created by this user
    await tx.comment.deleteMany({
      where: { authorId: userId },
    });
    
    // Delete notifications for this user (already handled by CASCADE, but explicit is better)
    await tx.notification.deleteMany({
      where: { userId: userId },
    });
    
    // Delete escalation logs where user is recipient
    await tx.escalationLog.deleteMany({
      where: { escalatedTo: userId },
    });
    
    // Delete SLA pause logs
    await tx.sLAPauseLog.deleteMany({
      where: { pausedBy: userId },
    });
    
    // Delete user achievements
    await tx.userAchievement.deleteMany({
      where: { userId: userId },
    });
    
    // Delete user stats
    await tx.userStats.delete({
      where: { userId: userId },
    }).catch(() => {
      // Ignore if doesn't exist
    });
    
    // Delete task templates created by this user
    await tx.taskTemplate.deleteMany({
      where: { createdById: userId },
    });
    
    // Finally, delete the user
    await tx.user.delete({
      where: { id: userId },
    });
  });
  
  // Create audit log (after user is deleted, so use admin's ID)
  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'USER_DELETED',
      entity: 'User',
      entityId: userId,
      oldValue: {
        name: user.name,
        email: user.email,
      },
    },
  });

  revalidatePath("/admin/users");
  
  return { success: true };
}

export async function changeUserRole(userId: string, role: Role) {
  const session = await auth();
  
  if (!session?.user || (session.user as any).role !== Role.ADMIN) {
    throw new Error('Không có quyền thực hiện hành động này');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  });
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
    },
  });
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'USER_ROLE_CHANGED',
      entity: 'User',
      entityId: userId,
      oldValue: { role: user.role },
      newValue: ({ role } as unknown) as Prisma.InputJsonValue,
    },
  });
  
  return updatedUser;
}

export async function assignUserTeam(userId: string, teamId: string | null) {
  const session = await auth();
  
  if (!session?.user || (session.user as any).role !== Role.ADMIN) {
    throw new Error('Không có quyền thực hiện hành động này');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, teamId: true },
  });
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  // Validate team if provided
  if (teamId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });
    
    if (!team) {
      throw new Error('Đội nhóm không tồn tại');
    }
  }
  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { teamId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
    },
  });
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'USER_TEAM_ASSIGNED',
      entity: 'User',
      entityId: userId,
      oldValue: { teamId: user.teamId },
      newValue: { teamId },
    },
  });
  
  return updatedUser;
}