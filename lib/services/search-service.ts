import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requestSearchSchema, taskSearchSchema, type RequestSearchParams, type TaskSearchParams } from "@/lib/validators/search";
import { Logger } from "@/lib/utils/logger";

// Request search query builder
export function buildRequestSearchQuery(params: RequestSearchParams): Prisma.RequestWhereInput {
  const where: Prisma.RequestWhereInput = {};

  // General query (full-text search)
  if (params.query) {
    where.OR = [
      { title: { contains: params.query, mode: 'insensitive' } },
      { description: { contains: params.query, mode: 'insensitive' } }
    ];
  }

  // Specific field filters
  if (params.title) {
    where.title = { contains: params.title, mode: 'insensitive' };
  }

  if (params.description) {
    where.description = { contains: params.description, mode: 'insensitive' };
  }

  if (params.status && params.status.length > 0) {
    where.status = { in: params.status as any };
  }

  if (params.priority && params.priority.length > 0) {
    where.priority = { in: params.priority as any };
  }

  if (params.categoryId && params.categoryId.length > 0) {
    where.categoryId = { in: params.categoryId };
  }

  if (params.creatorId && params.creatorId.length > 0) {
    where.creatorId = { in: params.creatorId };
  }

  if (params.teamId && params.teamId.length > 0) {
    where.teamId = { in: params.teamId };
  }

  // Tags filter
  if (params.tags && params.tags.length > 0) {
    where.tags = { hasSome: params.tags };
  }

  // Date ranges
  if (params.createdAt) {
    if (params.createdAt.from) {
      where.createdAt = { ...(where.createdAt as any), gte: params.createdAt.from };
    }
    if (params.createdAt.to) {
      where.createdAt = { ...(where.createdAt as any), lte: params.createdAt.to };
    }
  }

  if (params.deadline) {
    if (params.deadline.from) {
      where.deadline = { ...(where.deadline as any), gte: params.deadline.from };
    }
    if (params.deadline.to) {
      where.deadline = { ...(where.deadline as any), lte: params.deadline.to };
    }
  }

  // Boolean filters
  if (params.hasOverdue) {
    where.AND = [
      { deadline: { lt: new Date() } },
      { status: { not: 'DONE' } }
    ];
  }

  return where;
}

// Task search query builder
export function buildTaskSearchQuery(params: TaskSearchParams): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {};

  // General query (full-text search)
  if (params.query) {
    where.OR = [
      { title: { contains: params.query, mode: 'insensitive' } }
    ];
  }

  // Specific field filters
  if (params.title) {
    where.title = { contains: params.title, mode: 'insensitive' };
  }

  if (params.status && params.status.length > 0) {
    where.status = { in: params.status as any };
  }

  // Note: Task model doesn't have priority field, remove this filter
  // if (params.priority && params.priority.length > 0) {
  //   where.priority = { in: params.priority };
  // }

  if (params.assigneeId && params.assigneeId.length > 0) {
    where.assigneeId = { in: params.assigneeId };
  }

  if (params.requestId) {
    where.requestId = params.requestId;
  }

  // Date ranges
  if (params.createdAt) {
    if (params.createdAt.from) {
      where.createdAt = { ...(where.createdAt as any), gte: params.createdAt.from };
    }
    if (params.createdAt.to) {
      where.createdAt = { ...(where.createdAt as any), lte: params.createdAt.to };
    }
  }

  if (params.deadline) {
    if (params.deadline.from) {
      where.deadline = { ...(where.deadline as any), gte: params.deadline.from };
    }
    if (params.deadline.to) {
      where.deadline = { ...(where.deadline as any), lte: params.deadline.to };
    }
  }

  // Boolean filters
  if (params.hasDeadline) {
    where.deadline = { not: null };
  }

  if (params.isOverdue) {
    where.AND = [
      { deadline: { lt: new Date() } },
      { status: { not: 'DONE' } }
    ];
  }

  return where;
}

// Execute request search
export async function executeRequestSearch(params: RequestSearchParams) {
  const startTime = Date.now();
  
  try {
    // Validate params
    const validatedParams = requestSearchSchema.parse(params);
    
    // Build where clause
    const where = buildRequestSearchQuery(validatedParams);
    
    // Build orderBy
    const orderBy: Prisma.RequestOrderByWithRelationInput = {};
    orderBy[validatedParams.sortBy] = validatedParams.sortOrder;
    
    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit;
    const take = validatedParams.limit;
    
    // Execute query
    const [data, total] = await Promise.all([
      prisma.request.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          team: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } }
        }
      }),
      prisma.request.count({ where })
    ]);
    
    const duration = Date.now() - startTime;
    if (duration > 500) {
      Logger.warn("Slow request search query", { duration, params: validatedParams });
    }
    
    return {
      data,
      total,
      page: validatedParams.page,
      limit: validatedParams.limit,
      totalPages: Math.ceil(total / validatedParams.limit)
    };
  } catch (error) {
    Logger.captureException(error as Error, { action: "executeRequestSearch", params });
    throw new Error("Search failed");
  }
}

// Execute task search
export async function executeTaskSearch(params: TaskSearchParams) {
  const startTime = Date.now();
  
  try {
    // Validate params
    const validatedParams = taskSearchSchema.parse(params);
    
    // Build where clause
    const where = buildTaskSearchQuery(validatedParams);
    
    // Build orderBy
    const orderBy: Prisma.TaskOrderByWithRelationInput = {};
    if (validatedParams.sortBy === 'priority') {
      // Task doesn't have priority field, use createdAt instead
      orderBy.createdAt = validatedParams.sortOrder;
    } else {
      orderBy[validatedParams.sortBy as keyof Prisma.TaskOrderByWithRelationInput] = validatedParams.sortOrder;
    }
    
    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit;
    const take = validatedParams.limit;
    
    // Execute query
    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          request: { 
            select: { 
              id: true, 
              title: true, 
              priority: true,
              creator: { select: { name: true } }
            } 
          }
        }
      }),
      prisma.task.count({ where })
    ]);
    
    const duration = Date.now() - startTime;
    if (duration > 500) {
      Logger.warn("Slow task search query", { duration, params: validatedParams });
    }
    
    return {
      data,
      total,
      page: validatedParams.page,
      limit: validatedParams.limit,
      totalPages: Math.ceil(total / validatedParams.limit)
    };
  } catch (error) {
    Logger.captureException(error as Error, { action: "executeTaskSearch", params });
    throw new Error("Search failed");
  }
}

// Helper: highlight search results
export function highlightSearchResults(text: string, query: string): Array<{ text: string; highlight: boolean }> {
  if (!query || !text) {
    return [{ text, highlight: false }];
  }
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => ({
    text: part,
    highlight: index % 2 === 1 // Odd indices are matches
  }));
}

// Helper: build search URL with params
export function buildSearchUrl(baseUrl: string, params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(','));
      } else if (value instanceof Date) {
        searchParams.set(key, value.toISOString());
      } else {
        searchParams.set(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// Helper: parse search params from URL
export function parseSearchParams(searchParams: URLSearchParams): Record<string, any> {
  const params: Record<string, any> = {};
  
  for (const [key, value] of searchParams.entries()) {
    if (value.includes(',')) {
      params[key] = value.split(',');
    } else if (key.includes('Date') || key.includes('At')) {
      params[key] = new Date(value);
    } else if (value === 'true' || value === 'false') {
      params[key] = value === 'true';
    } else if (!isNaN(Number(value))) {
      params[key] = Number(value);
    } else {
      params[key] = value;
    }
  }
  
  return params;
}