import { Prisma, Priority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { add, differenceInMinutes, isBefore, parseISO } from "date-fns";
import { slaPauseService } from "./sla-pause-service";

export interface SlaCalculationInput {
  entityType: 'REQUEST' | 'TASK';
  priority: Priority;
  category?: string;
  startTime?: Date;
}

export interface SlaResult {
  deadline: Date;
  targetHours: number;
  slaConfigId: string;
}

export interface SlaStatus {
  status: 'ON_TIME' | 'AT_RISK' | 'OVERDUE' | 'PAUSED';
  timeRemaining: number; // minutes
  percentageRemaining: number; // 0-100
  deadline?: Date;
  effectiveDeadline?: Date;
  totalPaused?: number; // minutes
  isPaused?: boolean;
}

/**
 * Find the most applicable SLA configuration for the given input
 * Priority order: specific (priority+category) > priority-only > category-only > generic (null/null)
 */
export async function findApplicableSlaConfig(
  input: SlaCalculationInput
): Promise<Prisma.SlaConfigGetPayload<{}>> {
  const { entityType, priority, category } = input;

  // Build where clause for exact matches
  const whereClause: Prisma.SlaConfigWhereInput = {
    targetEntity: entityType,
    isActive: true,
  };

  // Get all matching configs
  const configs = await prisma.slaConfig.findMany({
    where: whereClause,
    orderBy: [
      { priority: 'desc' }, // nulls last
      { category: 'desc' }, // nulls last
    ],
  });

  if (configs.length === 0) {
    throw new Error(`No SLA configuration found for ${entityType} with priority ${priority}${category ? ` and category ${category}` : ''}`);
  }

  // Find the most specific match
  let bestMatch = null;
  let bestScore = -1;

  for (const config of configs) {
    let score = 0;
    
    // Priority match (2 points)
    if (config.priority === priority) {
      score += 2;
    } else if (config.priority === null) {
      score += 1; // Generic priority
    } else {
      continue; // Skip if priority doesn't match and isn't generic
    }

    // Category match (1 point)
    if (config.category === category) {
      score += 1;
    } else if (config.category === null) {
      score += 0.5; // Generic category
    } else if (category) {
      continue; // Skip if category doesn't match and isn't generic
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = config;
    }
  }

  if (!bestMatch) {
    throw new Error(`No applicable SLA configuration found for ${entityType} with priority ${priority}${category ? ` and category ${category}` : ''}`);
  }

  return bestMatch;
}

/**
 * Calculate SLA deadline based on input parameters
 */
export async function calculateSlaDeadline(
  input: SlaCalculationInput
): Promise<SlaResult> {
  const { startTime = new Date() } = input;

  // Validate start time
  if (!startTime || isNaN(startTime.getTime())) {
    throw new Error('Invalid start time provided');
  }

  // Find applicable SLA config
  const slaConfig = await findApplicableSlaConfig(input);

  // Calculate deadline
  const deadline = add(startTime, { hours: slaConfig.targetHours });

  return {
    deadline,
    targetHours: slaConfig.targetHours,
    slaConfigId: slaConfig.id,
  };
}

/**
 * Calculate SLA status based on deadline and paused duration
 */
/**
 * Calculate SLA Status with Pause Support
 * 
 * Updated to use SLA Pause Service for effective deadline calculation.
 * Ignores paused time in overdue calculation.
 * 
 * @param deadline - Original SLA deadline
 * @param pausedDuration - Total paused duration (minutes) - deprecated, use task object
 * @param task - Optional task object with pause data
 * @returns SLA status with effective deadline
 */
export async function calculateSlaStatus(
  deadline: Date,
  pausedDuration: number = 0,
  task?: {
    id: string;
    slaDeadline: Date | null;
    slaTotalPaused: number;
    slaPausedAt: Date | null;
  }
): Promise<SlaStatus> {
  const now = new Date();

  // If task object provided, use effective SLA calculation
  if (task) {
    const effectiveSLA = await slaPauseService.calculateEffectiveSLA(task);

    // If currently paused, return PAUSED status
    if (effectiveSLA.isPaused) {
      return {
        status: 'PAUSED',
        timeRemaining: 0,
        percentageRemaining: 0,
        deadline: effectiveSLA.originalDeadline || deadline,
        effectiveDeadline: effectiveSLA.adjustedDeadline || undefined,
        totalPaused: effectiveSLA.totalPausedMinutes,
        isPaused: true,
      };
    }

    // Use adjusted deadline for calculations
    const adjustedDeadline = effectiveSLA.adjustedDeadline || deadline;
    const timeRemaining = differenceInMinutes(adjustedDeadline, now);

    // Calculate percentage remaining
    const totalDuration = differenceInMinutes(
      adjustedDeadline,
      add(now, { minutes: -timeRemaining })
    );
    const percentageRemaining =
      totalDuration > 0 ? Math.max(0, (timeRemaining / totalDuration) * 100) : 0;

    let status: 'ON_TIME' | 'AT_RISK' | 'OVERDUE';

    if (timeRemaining <= 0) {
      status = 'OVERDUE';
    } else if (percentageRemaining < 25) {
      status = 'AT_RISK';
    } else {
      status = 'ON_TIME';
    }

    return {
      status,
      timeRemaining: Math.max(0, timeRemaining),
      percentageRemaining: Math.max(0, Math.min(100, percentageRemaining)),
      deadline: effectiveSLA.originalDeadline || deadline,
      effectiveDeadline: adjustedDeadline,
      totalPaused: effectiveSLA.totalPausedMinutes,
      isPaused: false,
    };
  }

  // Legacy support: Use pausedDuration parameter
  const adjustedDeadline = add(deadline, { minutes: pausedDuration });
  const timeRemaining = differenceInMinutes(adjustedDeadline, now);

  const totalDuration = differenceInMinutes(
    adjustedDeadline,
    add(now, { minutes: -timeRemaining })
  );
  const percentageRemaining =
    totalDuration > 0 ? Math.max(0, (timeRemaining / totalDuration) * 100) : 0;

  let status: 'ON_TIME' | 'AT_RISK' | 'OVERDUE';

  if (timeRemaining <= 0) {
    status = 'OVERDUE';
  } else if (percentageRemaining < 25) {
    status = 'AT_RISK';
  } else {
    status = 'ON_TIME';
  }

  return {
    status,
    timeRemaining: Math.max(0, timeRemaining),
    percentageRemaining: Math.max(0, Math.min(100, percentageRemaining)),
    deadline,
    effectiveDeadline: adjustedDeadline,
    totalPaused: pausedDuration,
    isPaused: false,
  };
}

/**
 * Pause SLA tracking for an entity
 */
export async function pauseSla(
  entity: { id: string; slaPausedAt?: Date | null }
): Promise<{ id: string; slaPausedAt: Date }> {
  const now = new Date();
  
  // Check if already paused
  if (entity.slaPausedAt) {
    throw new Error('SLA is already paused');
  }

  // Update entity with pause time
  const updatedEntity = await prisma.request.update({
    where: { id: entity.id },
    data: { slaPausedAt: now },
    select: { id: true, slaPausedAt: true },
  }).catch(async () => {
    // Try updating as task if request update failed
    return await prisma.task.update({
      where: { id: entity.id },
      data: { slaPausedAt: now },
      select: { id: true, slaPausedAt: true },
    });
  });

  return {
    id: updatedEntity.id,
    slaPausedAt: updatedEntity.slaPausedAt!,
  };
}

/**
 * Resume SLA tracking for an entity
 */
export async function resumeSla(
  entity: { 
    id: string; 
    slaPausedAt?: Date | null; 
    slaTotalPaused?: number;
    slaDeadline?: Date | null;
  }
): Promise<{ 
  id: string; 
  slaPausedAt: null; 
  slaTotalPaused: number;
  slaStatus: string;
}> {
  const now = new Date();
  
  // Check if currently paused
  if (!entity.slaPausedAt) {
    throw new Error('SLA is not currently paused');
  }

  // Calculate pause duration
  const pauseDuration = differenceInMinutes(now, entity.slaPausedAt);
  const totalPausedDuration = (entity.slaTotalPaused || 0) + pauseDuration;

  // Calculate new SLA status
  let slaStatus = 'ON_TIME';
  if (entity.slaDeadline) {
    const status = await calculateSlaStatus(entity.slaDeadline, totalPausedDuration);
    slaStatus = status.status;
  }

  // Update entity
  const updatedEntity = await prisma.request.update({
    where: { id: entity.id },
    data: { 
      slaPausedAt: null,
      slaPausedDuration: totalPausedDuration,
      slaStatus,
    },
    select: { 
      id: true, 
      slaPausedAt: true, 
      slaPausedDuration: true,
      slaStatus: true,
    },
  }).catch(async () => {
    // Try updating as task if request update failed
    return await prisma.task.update({
      where: { id: entity.id },
      data: { 
        slaPausedAt: null,
        slaTotalPaused: totalPausedDuration,
        slaStatus,
      },
      select: { 
        id: true, 
        slaPausedAt: true, 
        slaTotalPaused: true,
        slaStatus: true,
      },
    });
  });

  return {
    id: updatedEntity.id,
    slaPausedAt: null,
    slaTotalPaused: (updatedEntity as any).slaTotalPaused || (updatedEntity as any).slaPausedDuration || 0,
    slaStatus: updatedEntity.slaStatus || 'ON_TIME',
  };
}

/**
 * Initialize SLA tracking for a new entity
 */
export async function initializeSlaTracking(
  input: SlaCalculationInput,
  entityId: string
): Promise<SlaResult & { slaStatus: string }> {
  const slaResult = await calculateSlaDeadline(input);
  const now = new Date();
  
  // Calculate initial SLA status
  const status = calculateSlaStatus(slaResult.deadline, 0);
  
  // Update entity with SLA information
  await prisma.request.update({
    where: { id: entityId },
    data: {
      slaDeadline: slaResult.deadline,
      slaStatus: (await status).status,
      slaStartedAt: now,
      slaPausedDuration: 0,
    },
  }).catch(async () => {
    // Try updating as task if request update failed
    await prisma.task.update({
      where: { id: entityId },
      data: {
        slaDeadline: slaResult.deadline,
        slaStatus: (await status).status,
        slaStartedAt: now,
        slaTotalPaused: 0,
      },
    });
  });

  return {
    ...slaResult,
    slaStatus: (await status).status,
  };
}

/**
 * Update SLA status for an entity (useful for periodic status updates)
 */
export async function updateSlaStatus(
  entity: {
    id: string;
    slaDeadline?: Date | null;
    slaPausedDuration?: number;
    slaPausedAt?: Date | null;
  }
): Promise<{ slaStatus: string; timeRemaining: number }> {
  if (!entity.slaDeadline) {
    throw new Error('No SLA deadline set for this entity');
  }

  // Calculate current status
  const pausedDuration = entity.slaPausedAt ? 
    (entity.slaPausedDuration || 0) + differenceInMinutes(new Date(), entity.slaPausedAt) :
    (entity.slaPausedDuration || 0);

  const status = calculateSlaStatus(entity.slaDeadline, pausedDuration);

  // Update entity status
  await prisma.request.update({
    where: { id: entity.id },
    data: { slaStatus: (await status).status },
  }).catch(async () => {
    // Try updating as task if request update failed
    await prisma.task.update({
      where: { id: entity.id },
      data: { slaStatus: (await status).status },
    });
  });

  const resolvedStatus = await status;
  return {
    slaStatus: resolvedStatus.status,
    timeRemaining: resolvedStatus.timeRemaining,
  };
}
