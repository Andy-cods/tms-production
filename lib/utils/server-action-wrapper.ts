import { Logger } from "./logger";

export interface ServerActionContext {
  userId?: string;
  action: string;
  entityId?: string;
  requestId?: string;
  taskId?: string;
}

export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: ServerActionContext
) {
  return async (...args: T): Promise<R> => {
    try {
      Logger.info(`Starting ${context.action}`, context);
      const result = await fn(...args);
      Logger.info(`Completed ${context.action}`, context);
      return result;
    } catch (error) {
      Logger.captureException(error as Error, context);
      throw error;
    }
  };
}

export function withErrorHandlingAndReturn<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: ServerActionContext,
  defaultReturn: R
) {
  return async (...args: T): Promise<R> => {
    try {
      Logger.info(`Starting ${context.action}`, context);
      const result = await fn(...args);
      Logger.info(`Completed ${context.action}`, context);
      return result;
    } catch (error) {
      Logger.captureException(error as Error, context);
      return defaultReturn;
    }
  };
}
