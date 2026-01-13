import * as Sentry from "@sentry/nextjs";

export interface LogContext {
  userId?: string;
  action?: string;
  entityId?: string;
  requestId?: string;
  taskId?: string;
  [key: string]: any;
}

export class Logger {
  private static isSentryEnabled(): boolean {
    return process.env.NODE_ENV !== "test" && !!process.env.SENTRY_DSN;
  }

  static info(message: string, context?: LogContext) {
    console.log(`[INFO] ${message}`, context ? JSON.stringify(context) : "");
  }

  static warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : "");
  }

  static error(message: string, error?: Error, context?: LogContext) {
    console.error(`[ERROR] ${message}`, error, context ? JSON.stringify(context) : "");
    
    if (this.isSentryEnabled() && error) {
      Sentry.captureException(error, {
        tags: {
          component: "server-action",
        },
        extra: context,
      });
    }
  }

  static captureException(error: Error, context?: LogContext) {
    console.error(`[EXCEPTION] ${error.message}`, error, context ? JSON.stringify(context) : "");
    
    if (this.isSentryEnabled()) {
      Sentry.captureException(error, {
        tags: {
          component: "server-action",
        },
        extra: context,
      });
    }
  }

  static captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: LogContext) {
    console.log(`[${level.toUpperCase()}] ${message}`, context ? JSON.stringify(context) : "");
    
    if (this.isSentryEnabled()) {
      Sentry.captureMessage(message, {
        level,
        extra: context,
      });
    }
  }
}
