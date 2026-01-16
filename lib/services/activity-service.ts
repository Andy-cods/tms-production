import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/utils/logger";

export interface Activity {
  id: string;
  type: string;
  user: {
    id: string;
    name: string;
  };
  entity: {
    id: string;
    title: string;
    type: string;
  };
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ActiveUsersData {
  count: number;
  users: Array<{
    id: string;
    name: string;
    lastActivity: Date;
  }>;
}

/**
 * Get recent activities from AuditLog
 */
export async function getRecentActivities(limit: number = 20): Promise<Activity[]> {
  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            'REQUEST_CREATED',
            'REQUEST_UPDATED',
            'REQUEST_COMPLETED',
            'TASK_ASSIGNED',
            'TASK_COMPLETED',
            'COMMENT_ADDED',
            'STATUS_CHANGED',
          ],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    const activities: Activity[] = [];

    for (const log of auditLogs) {
      // Get entity details based on entityId
      let entityTitle = 'Unknown';
      let entityType = log.entity || 'UNKNOWN';

      // Try to get title from metadata
      if (log.newValue && typeof log.newValue === 'object') {
        const metadata = log.newValue as any;
        entityTitle = metadata.title || metadata.name || log.entityId || 'N/A';
      }

      // If no title in metadata, try to fetch from database
      if (entityTitle === 'Unknown' && log.entityId) {
        if (log.entity === 'REQUEST') {
          const request = await prisma.request.findUnique({
            where: { id: log.entityId },
            select: { title: true },
          });
          if (request) entityTitle = request.title;
        } else if (log.entity === 'TASK') {
          const task = await prisma.task.findUnique({
            where: { id: log.entityId },
            select: { title: true },
          });
          if (task) entityTitle = task.title;
        }
      }

      activities.push({
        id: log.id,
        type: log.action,
        user: {
          id: log.user.id,
          name: log.user.name,
        },
        entity: {
          id: log.entityId || '',
          title: entityTitle,
          type: entityType,
        },
        timestamp: log.createdAt,
        metadata: log.newValue ? (log.newValue as Record<string, any>) : undefined,
      });
    }

    return activities;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getRecentActivities" });
    return [];
  }
}

/**
 * Get count of active users (activity in last 5 minutes)
 */
export async function getActiveUsersCount(): Promise<ActiveUsersData> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Get unique users from recent audit logs
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: fiveMinutesAgo,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by user and get latest activity
    const userMap = new Map<string, { id: string; name: string; lastActivity: Date }>();
    
    for (const log of recentLogs) {
      if (!userMap.has(log.userId)) {
        userMap.set(log.userId, {
          id: log.user.id,
          name: log.user.name,
          lastActivity: log.createdAt,
        });
      }
    }

    const users = Array.from(userMap.values());

    return {
      count: users.length,
      users,
    };
  } catch (error) {
    Logger.captureException(error as Error, { action: "getActiveUsersCount" });
    return { count: 0, users: [] };
  }
}

/**
 * Format activity action to Vietnamese text
 */
export function formatActivityText(activity: Activity): string {
  const { type, user, entity } = activity;
  
  const actionMap: Record<string, string> = {
    REQUEST_CREATED: 'tạo yêu cầu',
    REQUEST_UPDATED: 'cập nhật yêu cầu',
    REQUEST_COMPLETED: 'hoàn thành yêu cầu',
    TASK_ASSIGNED: 'phân công công việc',
    TASK_COMPLETED: 'hoàn thành công việc',
    COMMENT_ADDED: 'bình luận về',
    STATUS_CHANGED: 'thay đổi trạng thái',
  };

  const action = actionMap[type] || 'thực hiện hành động';
  return `${user.name} ${action} "${entity.title}"`;
}
