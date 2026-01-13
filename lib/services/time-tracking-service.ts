import { prisma } from "@/lib/prisma";

export const timeTrackingService = {
  async startTimer(taskId: string, userId: string) {
    try {
      await prisma.timeLog.updateMany({
        where: { userId, isRunning: true },
        data: { isRunning: false, isPaused: true, pausedAt: new Date() },
      });

      const timeLog = await prisma.timeLog.create({
        data: { taskId, userId, startTime: new Date(), isRunning: true },
      });
      return { success: true, timeLog };
    } catch (error) {
      console.error("[TimeTracking] Start error:", error);
      return { success: false, error: "Không thể bắt đầu timer" };
    }
  },

  async stopTimer(timeLogId: string) {
    try {
      const timeLog = await prisma.timeLog.findUnique({ where: { id: timeLogId } });
      if (!timeLog) return { success: false, error: "Không tìm thấy time log" };

      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - timeLog.startTime.getTime()) / 1000);
      const updated = await prisma.timeLog.update({
        where: { id: timeLogId },
        data: { endTime, duration, isRunning: false },
      });

      await this.updateTaskTotalTime(timeLog.taskId);
      return { success: true, timeLog: updated, duration };
    } catch (error) {
      console.error("[TimeTracking] Stop error:", error);
      return { success: false, error: "Không thể dừng timer" };
    }
  },

  async pauseTimer(timeLogId: string) {
    try {
      const updated = await prisma.timeLog.update({
        where: { id: timeLogId },
        data: { isPaused: true, pausedAt: new Date() },
      });
      return { success: true, timeLog: updated };
    } catch (error) {
      console.error("[TimeTracking] Pause error:", error);
      return { success: false, error: "Không thể tạm dừng" };
    }
  },

  async resumeTimer(timeLogId: string) {
    try {
      const updated = await prisma.timeLog.update({
        where: { id: timeLogId },
        data: { isPaused: false, pausedAt: null },
      });
      return { success: true, timeLog: updated };
    } catch (error) {
      console.error("[TimeTracking] Resume error:", error);
      return { success: false, error: "Không thể tiếp tục" };
    }
  },

  async getActiveTimer(userId: string) {
    try {
      const activeTimer = await prisma.timeLog.findFirst({
        where: { userId, isRunning: true },
        include: { task: { select: { id: true, title: true } } },
        orderBy: { startTime: "desc" },
      });
      return { success: true, activeTimer };
    } catch (error) {
      console.error("[TimeTracking] Get active timer error:", error);
      return { success: false, error: "Lỗi tải timer" };
    }
  },

  async getTaskTimeLogs(taskId: string) {
    try {
      const logs = await prisma.timeLog.findMany({
        where: { taskId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { startTime: "desc" },
      });
      return { success: true, logs };
    } catch (error) {
      console.error("[TimeTracking] Get task logs error:", error);
      return { success: false, error: "Lỗi tải time logs" };
    }
  },

  async getUserTimeLogs(userId: string, startDate: Date, endDate: Date) {
    try {
      const logs = await prisma.timeLog.findMany({
        where: { userId, startTime: { gte: startDate, lte: endDate } },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              request: { select: { id: true, title: true, category: { select: { name: true } } } },
            },
          },
          user: { select: { name: true, email: true } },
        },
        orderBy: { startTime: "desc" },
      });
      return { success: true, logs };
    } catch (error) {
      console.error("[TimeTracking] Get user logs error:", error);
      return { success: false, error: "Lỗi tải time logs" };
    }
  },

  async addManualLog(taskId: string, userId: string, startTime: Date, endTime: Date, notes?: string) {
    try {
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      if (duration <= 0) return { success: false, error: "Thời gian không hợp lệ" };

      const timeLog = await prisma.timeLog.create({
        data: { taskId, userId, startTime, endTime, duration, isRunning: false, notes },
      });
      await this.updateTaskTotalTime(taskId);
      return { success: true, timeLog };
    } catch (error) {
      console.error("[TimeTracking] Add manual log error:", error);
      return { success: false, error: "Không thể thêm time log" };
    }
  },

  async updateTimeLog(timeLogId: string, data: { startTime?: Date; endTime?: Date; notes?: string; isBillable?: boolean }) {
    try {
      let duration: number | undefined;
      if (data.startTime || data.endTime) {
        const log = await prisma.timeLog.findUnique({ where: { id: timeLogId } });
        if (!log) return { success: false, error: "Không tìm thấy log" };
        const start = data.startTime || log.startTime;
        const end = data.endTime || log.endTime;
        if (end) duration = Math.floor((end.getTime() - start.getTime()) / 1000);
      }

      const updated = await prisma.timeLog.update({
        where: { id: timeLogId },
        data: { ...data, ...(duration !== undefined && { duration }) },
      });

      if (duration !== undefined) await this.updateTaskTotalTime(updated.taskId);
      return { success: true, timeLog: updated };
    } catch (error) {
      console.error("[TimeTracking] Update log error:", error);
      return { success: false, error: "Không thể cập nhật" };
    }
  },

  async deleteTimeLog(timeLogId: string) {
    try {
      const log = await prisma.timeLog.findUnique({ where: { id: timeLogId } });
      if (!log) return { success: false, error: "Không tìm thấy log" };
      await prisma.timeLog.delete({ where: { id: timeLogId } });
      await this.updateTaskTotalTime(log.taskId);
      return { success: true };
    } catch (error) {
      console.error("[TimeTracking] Delete log error:", error);
      return { success: false, error: "Không thể xóa" };
    }
  },

  async updateTaskTotalTime(taskId: string) {
    try {
      const agg = await prisma.timeLog.aggregate({ where: { taskId, duration: { not: null } }, _sum: { duration: true } });
      const totalSeconds = agg._sum.duration || 0;
      await prisma.task.update({ where: { id: taskId }, data: { totalTimeSpent: totalSeconds } });
      const totalMinutes = Math.floor(totalSeconds / 60);
      await prisma.taskEstimate.upsert({ where: { taskId }, create: { taskId, estimatedMinutes: 0, actualMinutes: totalMinutes }, update: { actualMinutes: totalMinutes } });
      return { success: true, totalSeconds };
    } catch (error) {
      console.error("[TimeTracking] Update total time error:", error);
      return { success: false, error: "Lỗi cập nhật tổng thời gian" };
    }
  },

  async getUserAnalytics(userId: string, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const logs = await prisma.timeLog.findMany({
        where: { userId, startTime: { gte: startDate }, duration: { not: null } },
        include: { task: { include: { request: { include: { category: true } } } } },
      });
      const totalSeconds = logs.reduce((s, l) => s + (l.duration || 0), 0);
      const byCategory: Record<string, number> = {};
      const byDay: Record<string, number> = {};
      logs.forEach((l) => {
        const cat = l.task.request?.category?.name || "Uncategorized";
        byCategory[cat] = (byCategory[cat] || 0) + (l.duration || 0);
        const day = l.startTime.toISOString().split("T")[0];
        byDay[day] = (byDay[day] || 0) + (l.duration || 0);
      });
      const tasksWorkedOn = new Set(logs.map((l) => l.taskId)).size;
      return { success: true, analytics: { totalSeconds, totalHours: (totalSeconds / 3600).toFixed(1), byCategory, byDay, tasksWorkedOn, logsCount: logs.length } };
    } catch (error) {
      console.error("[TimeTracking] Analytics error:", error);
      return { success: false, error: "Lỗi tính analytics" };
    }
  },

  formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  },

  formatHumanDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${seconds}s`;
  },
};
