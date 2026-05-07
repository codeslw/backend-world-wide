import { Injectable, Logger, LogLevel } from '@nestjs/common';

/**
 * AppLoggerService — a thin, injectable wrapper around NestJS's built-in Logger.
 *
 * Usage:
 *   constructor(private logger: AppLoggerService) {
 *     this.logger.setContext('MyService');
 *   }
 *
 * Or provide a static context at construction time:
 *   private readonly logger = new AppLoggerService(MyService.name);
 */
@Injectable()
export class AppLoggerService extends Logger {
  constructor(context?: string) {
    super(context ?? 'App');
  }

  /** Log a verbose/debug message (only shown in development) */
  verbose(message: any, context?: string): void {
    super.verbose(message, context);
  }

  /** Log a general informational message */
  log(message: any, context?: string): void {
    super.log(message, context);
  }

  /** Log a warning */
  warn(message: any, context?: string): void {
    super.warn(message, context);
  }

  /** Log an error with optional stack trace */
  error(message: any, trace?: string, context?: string): void {
    super.error(message, trace, context);
  }

  /** Log an error including the original Error object's stack automatically */
  logError(message: string, error: unknown, context?: string): void {
    const stack = error instanceof Error ? error.stack : String(error);
    super.error(`${message}: ${error instanceof Error ? error.message : error}`, stack, context);
  }
}
