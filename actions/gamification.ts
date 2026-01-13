"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth-helpers";
import { Prisma } from "@prisma/client";

/**
 * Update avatar settings
 */
export async function updateAvatar(data: {
  avatarSkin: string;
  avatarHair: string;
  avatarHairColor: string;
  avatarEyes: string;
  avatarMouth: string;
  avatarAccessory: string | null;
  avatarBackground: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = getUserId(session);

    const db = prisma as any;
    // Get or create gamification
    let gamification = await db.userGamification?.findUnique({
      where: { userId },
    });

    if (!gamification) {
      gamification = await db.userGamification?.create({
        data: {
          userId,
          totalXP: 0,
          level: 1,
          xpToNextLevel: 100,
        },
      });
    }

    // Update avatar
    await db.userGamification?.update({
      where: { userId },
      data: {
        avatarSkin: data.avatarSkin,
        avatarHair: data.avatarHair,
        avatarHairColor: data.avatarHairColor,
        avatarEyes: data.avatarEyes,
        avatarMouth: data.avatarMouth,
        avatarAccessory: data.avatarAccessory,
        avatarBackground: data.avatarBackground,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("[updateAvatar]:", error);
    return { success: false, error: "Lỗi lưu avatar" };
  }
}

export async function updateUserAvatar(data: {
  avatarSkin: string;
  avatarHair: string;
  avatarHairColor: string;
  avatarEyes: string;
  avatarMouth: string;
  avatarAccessory: string | null;
  avatarBackground: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = getUserId(session);

    // Update UserStats with avatar config
    await prisma.userStats.upsert({
      where: { userId },
      create: {
        userId,
        level: 1,
        experiencePoints: 0,
        avatarSkin: data.avatarSkin,
        avatarHair: data.avatarHair,
        avatarHairColor: data.avatarHairColor,
        avatarEyes: data.avatarEyes,
        avatarMouth: data.avatarMouth,
        avatarAccessory: data.avatarAccessory,
        avatarBackground: data.avatarBackground,
      },
      update: {
        avatarSkin: data.avatarSkin,
        avatarHair: data.avatarHair,
        avatarHairColor: data.avatarHairColor,
        avatarEyes: data.avatarEyes,
        avatarMouth: data.avatarMouth,
        avatarAccessory: data.avatarAccessory,
        avatarBackground: data.avatarBackground,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Avatar",
        entityId: userId,
        userId,
        newValue: ({
          avatarSkin: data.avatarSkin,
          avatarHair: data.avatarHair,
          avatarHairColor: data.avatarHairColor,
          avatarEyes: data.avatarEyes,
          avatarMouth: data.avatarMouth,
          avatarAccessory: data.avatarAccessory,
          avatarBackground: data.avatarBackground,
        } as unknown) as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("[updateUserAvatar]:", error);
    return { success: false, error: "Lỗi cập nhật avatar" };
  }
}

/**
 * Get user gamification data
 */
export async function getUserGamification(userId?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const targetUserId = userId || getUserId(session);

    const stats = await prisma.userStats.findUnique({
      where: { userId: targetUserId },
    });

    return { success: true, gamification: stats };
  } catch (error) {
    console.error("[getUserGamification]:", error);
    return { success: false, error: "Lỗi tải dữ liệu" };
  }
}

/**
 * Equip a badge
 */
export async function equipBadge(userBadgeId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = getUserId(session);

    // Verify badge belongs to user
    const db = prisma as any;
    const userBadge = await db.userBadge?.findUnique({
      where: { id: userBadgeId },
    });

    if (!userBadge || userBadge.userId !== userId) {
      return { success: false, error: "Badge không tồn tại" };
    }

    // Unequip all other badges first
    await db.userBadge?.updateMany({
      where: { userId },
      data: { isEquipped: false },
    });

    // Equip this badge
    await db.userBadge?.update({
      where: { id: userBadgeId },
      data: { isEquipped: true },
    });

    revalidatePath("/profile");
    revalidatePath("/achievements");

    return { success: true };
  } catch (error) {
    console.error("[equipBadge]:", error);
    return { success: false, error: "Lỗi equip badge" };
  }
}

/**
 * Unequip a badge
 */
export async function unequipBadge(userBadgeId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = getUserId(session);

    // Verify badge belongs to user
    const db = prisma as any;
    const userBadge = await db.userBadge?.findUnique({
      where: { id: userBadgeId },
    });

    if (!userBadge || userBadge.userId !== userId) {
      return { success: false, error: "Badge không tồn tại" };
    }

    // Unequip badge
    await db.userBadge?.update({
      where: { id: userBadgeId },
      data: { isEquipped: false },
    });

    revalidatePath("/profile");
    revalidatePath("/achievements");

    return { success: true };
  } catch (error) {
    console.error("[unequipBadge]:", error);
    return { success: false, error: "Lỗi unequip badge" };
  }
}

/**
 * Adopt a pet
 */
export async function adoptPet(data: { petType: any; petName: string }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = getUserId(session);

    // Check if already has pet
    const existingStats = await prisma.userStats.findUnique({
      where: { userId },
      select: { petType: true },
    });

    if (existingStats?.petType) {
      return { success: false, error: "Bạn đã có pet rồi" };
    }

    // Create/update UserStats with pet
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        petType: data.petType,
        petName: data.petName,
        petLevel: 1,
        petExperience: 0,
        petHappiness: 100,
        petLastFed: new Date(),
        petAdoptedAt: new Date(),
      },
      create: {
        userId,
        level: 1,
        experiencePoints: 0,
        petType: data.petType,
        petName: data.petName,
        petLevel: 1,
        petExperience: 0,
        petHappiness: 100,
        petLastFed: new Date(),
        petAdoptedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Pet",
        entityId: userId,
        userId,
        newValue: ({ petType: data.petType, petName: data.petName } as unknown) as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/gaming");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[adoptPet]:", error);
    return { success: false, error: "Lỗi adopt pet" };
  }
}

/**
 * Update pet name
 */
export async function updatePetName(petName: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = getUserId(session);

    if (!petName || petName.trim().length === 0) {
      return { success: false, error: "Tên pet không được để trống" };
    }

    if (petName.trim().length > 20) {
      return { success: false, error: "Tên pet không được quá 20 ký tự" };
    }

    // Check if user has pet
    const stats = await prisma.userStats.findUnique({
      where: { userId },
      select: { petType: true },
    });

    if (!stats?.petType) {
      return { success: false, error: "Bạn chưa có pet" };
    }

    // Update pet name
    await prisma.userStats.update({
      where: { userId },
      data: {
        petName: petName.trim(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Pet",
        entityId: userId,
        userId,
        newValue: ({ petName: petName.trim() } as unknown) as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/gaming");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[updatePetName]:", error);
    return { success: false, error: "Lỗi cập nhật tên pet" };
  }
}

/**
 * Calculate pet happiness based on time since last fed
 * Happiness decreases over time:
 * - 0-6 hours: No decrease
 * - 6-12 hours: -1 per hour
 * - 12-24 hours: -2 per hour
 * - 24+ hours: -3 per hour
 * Minimum happiness: 0
 */
function calculateHappinessFromTime(lastFed: Date | null, currentHappiness: number): number {
  if (!lastFed) {
    return Math.max(0, currentHappiness - 10); // If never fed, decrease by 10
  }

  const now = new Date();
  const hoursSinceLastFed = (now.getTime() - lastFed.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastFed <= 6) {
    // No decrease for first 6 hours
    return currentHappiness;
  } else if (hoursSinceLastFed <= 12) {
    // -1 per hour after 6 hours
    const decrease = Math.floor(hoursSinceLastFed - 6);
    return Math.max(0, currentHappiness - decrease);
  } else if (hoursSinceLastFed <= 24) {
    // -2 per hour after 12 hours
    const decrease = 6 + Math.floor((hoursSinceLastFed - 12) * 2);
    return Math.max(0, currentHappiness - decrease);
  } else {
    // -3 per hour after 24 hours
    const decrease = 6 + 24 + Math.floor((hoursSinceLastFed - 24) * 3);
    return Math.max(0, currentHappiness - decrease);
  }
}

/**
 * Get pet data with calculated happiness
 */
export async function getPetData() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = getUserId(session);

    const stats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats?.petType) {
      return { success: false, error: "Bạn chưa có pet" };
    }

    // Calculate current happiness based on time
    const calculatedHappiness = calculateHappinessFromTime(
      stats.petLastFed,
      stats.petHappiness || 100
    );

    // Update happiness in database if it changed
    if (calculatedHappiness !== stats.petHappiness) {
      await prisma.userStats.update({
        where: { userId },
        data: { petHappiness: calculatedHappiness },
      });
    }

    return {
      success: true,
      pet: {
        petType: stats.petType,
        petName: stats.petName,
        petLevel: stats.petLevel || 1,
        petHappiness: calculatedHappiness,
        petLastFed: stats.petLastFed,
        petExperience: stats.petExperience || 0,
      },
    };
  } catch (error) {
    console.error("[getPetData]:", error);
    return { success: false, error: "Lỗi tải dữ liệu pet" };
  }
}

/**
 * Feed pet (manual)
 */
export async function feedPet() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = getUserId(session);

    const stats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats?.petType) {
      return { success: false, error: "Bạn chưa có pet" };
    }

    // Check cooldown (can feed every 1 hour)
    const lastFed = stats.petLastFed;
    if (lastFed) {
      const hoursSinceLastFed =
        (Date.now() - lastFed.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastFed < 1) {
        const minutesRemaining = Math.ceil((1 - hoursSinceLastFed) * 60);
        return {
          success: false,
          error: `Pet chưa đói. Có thể feed sau ${minutesRemaining} phút`,
        };
      }
    }

    // Calculate current happiness (may have decreased over time)
    const currentHappiness = calculateHappinessFromTime(
      lastFed,
      stats.petHappiness || 100
    );

    // Feed pet - restore happiness and add bonus
    const newHappiness = Math.min(100, currentHappiness + 20); // +20 happiness when fed
    const newPetXP = (stats.petExperience || 0) + 5;
    const newPetLevel = Math.floor(newPetXP / 100) + 1;

    await prisma.userStats.update({
      where: { userId },
      data: {
        petHappiness: newHappiness,
        petExperience: newPetXP,
        petLevel: newPetLevel,
        petLastFed: new Date(),
      },
    });

    revalidatePath("/profile");
    revalidatePath("/gaming");
    revalidatePath("/dashboard");

    return {
      success: true,
      happiness: newHappiness,
      xp: newPetXP,
      level: newPetLevel,
    };
  } catch (error) {
    console.error("[feedPet]:", error);
    return { success: false, error: "Lỗi feed pet" };
  }
}

