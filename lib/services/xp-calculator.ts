import { prisma } from "@/lib/prisma";
const db: any = prisma as any;

export const xpCalculator = {
  /**
   * XP rewards based on task completion
   */
  XP_REWARDS: {
    TASK_COMPLETED: 10,
    TASK_ON_TIME: 20,
    TASK_EARLY: 30,
    TASK_PERFECT: 50, // No rework
    COMMENT_ADDED: 2,
    CLARIFICATION_RESOLVED: 5,
    HELP_TEAMMATE: 15,
  },

  /**
   * Calculate XP needed for next level
   * Formula: 100 * level^1.5
   */
  calculateXPForLevel(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.5));
  },

  /**
   * Calculate level from total XP
   */
  calculateLevelFromXP(totalXP: number): number {
    let level = 1;
    let cumulativeXP = 0;

    while (true) {
      const xpForThisLevel = this.calculateXPForLevel(level);
      if (cumulativeXP + xpForThisLevel > totalXP) {
        return level - 1;
      }
      cumulativeXP += xpForThisLevel;
      level++;
      
      // Safety check to prevent infinite loop
      if (level > 1000) return level - 1;
    }
  },

  /**
   * Award XP to user
   */
  async awardXP(
    userId: string,
    amount: number,
    reason: string
  ): Promise<{
    newXP: number;
    newLevel: number;
    leveledUp: boolean;
    xpToNextLevel: number;
  }> {
    // Get or create gamification record
    let gamification = await db.userGamification?.findUnique({
      where: { userId },
    });

    if (!gamification) {
      gamification = await db.userGamification?.create({
        data: {
          userId,
          totalXP: 0,
          level: 1,
          xpToNextLevel: this.calculateXPForLevel(1),
        },
      });
    }

    const oldLevel = gamification.level;
    const newTotalXP = gamification.totalXP + amount;
    const newLevel = this.calculateLevelFromXP(newTotalXP);
    const leveledUp = newLevel > oldLevel;

    // Calculate XP needed for next level
    let cumulativeXP = 0;
    for (let i = 1; i <= newLevel; i++) {
      cumulativeXP += this.calculateXPForLevel(i);
    }
    const xpToNextLevel = cumulativeXP - newTotalXP;

    // Update gamification
    await db.userGamification?.update({
      where: { userId },
      data: {
        totalXP: newTotalXP,
        level: newLevel,
        xpToNextLevel: Math.max(0, xpToNextLevel),
      },
    });

    // Create notification if leveled up
    if (leveledUp) {
      await db.notification?.create({
        data: {
          userId,
          type: "COMPLETED" as any, // Use existing notification type
          title: `🎉 Level Up! Bạn đạt Level ${newLevel}`,
          message: `Chúc mừng! Bạn vừa thăng cấp lên Level ${newLevel}`,
          link: "/profile",
        },
      });
    }

    return {
      newXP: newTotalXP,
      newLevel,
      leveledUp,
      xpToNextLevel: Math.max(0, xpToNextLevel),
    };
  },

  /**
   * Update streak
   */
  async updateStreak(userId: string) {
    const gamification = await db.userGamification?.findUnique({
      where: { userId },
    });

    if (!gamification) {
      // Create gamification if it doesn't exist
      await db.userGamification?.create({
        data: {
          userId,
          totalXP: 0,
          level: 1,
          xpToNextLevel: this.calculateXPForLevel(1),
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: new Date(),
        },
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = gamification.lastActiveDate;

    if (!lastActive) {
      // First activity
      await db.userGamification?.update({
        where: { userId },
        data: {
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: new Date(),
        },
      });
      return;
    }

    const lastActiveDate = new Date(lastActive);
    lastActiveDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      // Same day - no change
      return;
    } else if (diffDays === 1) {
      // Consecutive day - increment streak
      const newStreak = gamification.currentStreak + 1;
      const newLongest = Math.max(newStreak, gamification.longestStreak);

      await db.userGamification?.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActiveDate: new Date(),
        },
      });

      // Check streak achievements
      if (newStreak === 7) {
        await this.checkAchievement(userId, "STREAK_MASTER");
      }
    } else {
      // Streak broken
      await db.userGamification?.update({
        where: { userId },
        data: {
          currentStreak: 1,
          lastActiveDate: new Date(),
        },
      });
    }
  },

  /**
   * Award task completion XP
   */
  async awardTaskCompletionXP(taskId: string) {
    const task = await db.task?.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        request: true,
      },
    });

    if (!task || !task.assignee) return;

    let xpAmount = this.XP_REWARDS.TASK_COMPLETED;
    let reason = "Hoàn thành task";

    // Bonus for on-time
    if (task.deadline && task.updatedAt <= task.deadline) {
      xpAmount += this.XP_REWARDS.TASK_ON_TIME;
      reason += " đúng hạn";

      // Bonus for early (>1 day early)
      const hoursEarly =
        (task.deadline.getTime() - task.updatedAt.getTime()) /
        (1000 * 60 * 60);
      if (hoursEarly > 24) {
        xpAmount += this.XP_REWARDS.TASK_EARLY;
        reason += " (sớm hạn)";
      }
    }

    // Award XP
    const result = await this.awardXP(task.assignee.id, xpAmount, reason);

    // Update stats
    await db.userGamification?.update({
      where: { userId: task.assignee.id },
      data: {
        tasksCompleted: { increment: 1 },
        tasksOnTime:
          task.deadline && task.updatedAt <= task.deadline
            ? { increment: 1 }
            : undefined,
      },
    });

    // Update streak
    await this.updateStreak(task.assignee.id);

    // Check achievements
    await this.checkAchievements(task.assignee.id);

    // Feed pet
    await this.feedPet(task.assignee.id, 10);

    return result;
  },

  /**
   * Check if user earned achievement
   */
  async checkAchievement(userId: string, achievementType: string) {
    const achievement = await db.achievementGamification?.findUnique({
      where: { type: achievementType as any },
    });

    if (!achievement) return;

    // Check if already earned
    const existing = await db.userAchievementGamification?.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (existing?.isCompleted) return;

    // Check requirement
    const gamification = await db.userGamification?.findUnique({
      where: { userId },
    });

    if (!gamification) return;

    const req = achievement.requirement as any;
    let isEarned = false;

    switch (achievementType) {
      case "FIRST_BLOOD":
        isEarned = gamification.tasksCompleted >= 1;
        break;
      case "CENTURY":
        isEarned = gamification.tasksCompleted >= 100;
        break;
      case "STREAK_MASTER":
        isEarned = gamification.currentStreak >= 7;
        break;
      case "PERFECT_WEEK":
        // Check last 7 days - all tasks on time
        // Implementation depends on task tracking
        // For now, check if tasksOnTime ratio is high
        if (gamification.tasksCompleted > 0) {
          const onTimeRatio = gamification.tasksOnTime / gamification.tasksCompleted;
          isEarned = onTimeRatio >= 0.95 && gamification.tasksCompleted >= 5;
        }
        break;
      case "OVERACHIEVER":
        // Check if many tasks completed early
        // Simplified: check if on-time ratio is high
        if (gamification.tasksCompleted >= 10) {
          const onTimeRatio = gamification.tasksOnTime / gamification.tasksCompleted;
          isEarned = onTimeRatio >= 0.8;
        }
        break;
      // Other achievements would need more complex logic
      default:
        break;
    }

    if (isEarned) {
      await db.userAchievementGamification?.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
        },
        create: {
          userId,
          achievementId: achievement.id,
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      // Award XP
      if (achievement.xpReward > 0) {
        await this.awardXP(
          userId,
          achievement.xpReward,
          `Achievement: ${achievement.name}`
        );
      }

      // Notification
      await db.notification?.create({
        data: {
          userId,
          type: "COMPLETED" as any, // Use existing notification type
          title: `🏆 Achievement Unlocked!`,
          message: `Bạn vừa mở khóa: ${achievement.name}`,
          link: "/profile",
        },
      });
    }
  },

  /**
   * Check all achievements
   */
  async checkAchievements(userId: string) {
    const achievements = await db.achievementGamification?.findMany({
      where: { isActive: true },
    });

    for (const achievement of achievements) {
      await this.checkAchievement(userId, (achievement as any).type);
    }
  },

  /**
   * Feed pet (increase happiness & XP)
   */
  async feedPet(userId: string, amount: number) {
    const gamification = await db.userGamification?.findUnique({
      where: { userId },
    });

    if (!gamification?.petType) return;

    const newHappiness = Math.min(100, gamification.petHappiness + amount);
    const newPetXP = gamification.petXP + amount;

    // Pet level up every 100 XP
    const newPetLevel = Math.floor(newPetXP / 100) + 1;
    const leveledUp = newPetLevel > gamification.petLevel;

    await db.userGamification?.update({
      where: { userId },
      data: {
        petHappiness: newHappiness,
        petXP: newPetXP,
        petLevel: newPetLevel,
        petLastFed: new Date(),
      },
    });

    if (leveledUp) {
      await db.notification?.create({
        data: {
          userId,
          type: "COMPLETED" as any, // Use existing notification type
          title: `🐾 Pet Level Up!`,
          message: `${gamification.petName || "Pet"} đạt Level ${newPetLevel}!`,
          link: "/profile",
        },
      });
    }
  },
};

