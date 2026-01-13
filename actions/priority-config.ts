"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Logger } from "@/lib/utils/logger"

// Use types from @/types instead
import { UserRole } from "@/types"

async function ensureAdminUser() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { id: true, role: true }
  })
  
  if (!user || user.role !== "ADMIN") {
    throw new Error("FORBIDDEN")
  }
  
  return user
}

export async function updatePriorityConfigWeight(
  configId: string, 
  weight: number
): Promise<{ ok: boolean; message: string }> {
  try {
    // Check auth + ADMIN role
    await ensureAdminUser()
    
    // Validate weight
    if (weight <= 0 || weight > 5) {
      Logger.warn("Invalid weight value", { action: "updatePriorityConfigWeight", weight })
      return { ok: false, message: "Trọng số phải từ 0.1 đến 5.0" }
    }
    
    // Update PriorityConfig.weight
    await prisma.priorityConfig.update({
      where: { id: configId },
      data: { weight }
    })
    
    Logger.info("Priority config weight updated", { 
      action: "updatePriorityConfigWeight", 
      configId, 
      weight 
    })
    
    revalidatePath("/admin/priority-config")
    return { ok: true, message: "Cập nhật trọng số thành công" }
    
  } catch (error) {
    Logger.captureException(error as Error, { action: "updatePriorityConfigWeight", configId })
    return { ok: false, message: "Lỗi cập nhật trọng số" }
  }
}

export async function updatePriorityThreshold(
  thresholdId: string,
  minScore: number,
  maxScore: number
): Promise<{ ok: boolean; message: string }> {
  try {
    // Check auth + ADMIN role
    await ensureAdminUser()
    
    // Validate scores
    if (minScore >= maxScore) {
      Logger.warn("Invalid score range", { action: "updatePriorityThreshold", minScore, maxScore })
      return { ok: false, message: "Điểm tối thiểu phải nhỏ hơn điểm tối đa" }
    }
    
    if (minScore < 0 || maxScore > 25) {
      Logger.warn("Score out of range", { action: "updatePriorityThreshold", minScore, maxScore })
      return { ok: false, message: "Điểm phải từ 0 đến 25" }
    }
    
    // Check for gaps/overlaps with other thresholds
    const otherThresholds = await prisma.priorityThreshold.findMany({
      where: { id: { not: thresholdId } },
      orderBy: { minScore: "asc" }
    })
    
    // Check for overlaps
    for (const threshold of otherThresholds) {
      if (
        (minScore >= threshold.minScore && minScore < threshold.maxScore) ||
        (maxScore > threshold.minScore && maxScore <= threshold.maxScore) ||
        (minScore <= threshold.minScore && maxScore >= threshold.maxScore)
      ) {
        Logger.warn("Threshold overlap detected", { 
          action: "updatePriorityThreshold", 
          minScore, 
          maxScore,
          existingMin: threshold.minScore,
          existingMax: threshold.maxScore
        })
        return { ok: false, message: "Khoảng điểm bị trùng lặp với ngưỡng khác" }
      }
    }
    
    // Update PriorityThreshold
    await prisma.priorityThreshold.update({
      where: { id: thresholdId },
      data: { minScore, maxScore }
    })
    
    Logger.info("Priority threshold updated", { 
      action: "updatePriorityThreshold", 
      thresholdId, 
      minScore, 
      maxScore 
    })
    
    revalidatePath("/admin/priority-config")
    return { ok: true, message: "Cập nhật ngưỡng điểm thành công" }
    
  } catch (error) {
    Logger.captureException(error as Error, { action: "updatePriorityThreshold", thresholdId })
    return { ok: false, message: "Lỗi cập nhật ngưỡng điểm" }
  }
}
