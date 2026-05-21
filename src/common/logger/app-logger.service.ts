import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogContextService } from './log-context.service';

type LogFormat = 'json' | 'pretty';

interface LogEntry {
  timestamp: string;
  level: LogLevel | 'fatal';
  message: unknown;
  context?: string;
  requestId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  pid: number;
  environment: string;
  stack?: string;
  metadata?: unknown[];
}

@Injectable()
export class AppLoggerService implements LoggerService {
  private levels: LogLevel[];
  private readonly format: LogFormat;
  private readonly environment: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logContextService: LogContextService,
  ) {
    this.environment =
      this.configService.get<string>('NODE_ENV') ?? 'development';
    this.levels = this.resolveLogLevels();
    this.format = this.resolveFormat();
  }

  setLogLevels(levels: LogLevel[]): void {
    this.levels = levels;
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('log', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('verbose', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write('fatal', message, optionalParams);
  }

  logError(message: string, error: unknown, context?: string): void {
    const stack = error instanceof Error ? error.stack : undefined;
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.error(`${message}: ${errorMessage}`, stack, context);
  }

  private write(
    level: LogLevel | 'fatal',
    message: unknown,
    optionalParams: unknown[],
  ): void {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const { context, stack, metadata } = this.parseOptionalParams(
      level,
      optionalParams,
    );
    const requestContext = this.logContextService.get();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.normalizeMessage(message),
      context,
      requestId: requestContext?.requestId,
      method: requestContext?.method,
      path: requestContext?.path,
      ip: requestContext?.ip,
      userAgent: requestContext?.userAgent,
      userId: requestContext?.userId,
      pid: process.pid,
      environment: this.environment,
      stack,
      metadata: metadata.length > 0 ? metadata : undefined,
    };

    this.print(entry);
  }

  private parseOptionalParams(
    level: LogLevel | 'fatal',
    optionalParams: unknown[],
  ): { context?: string; stack?: string; metadata: unknown[] } {
    const params = [...optionalParams];
    let context: string | undefined;
    let stack: string | undefined;

    if (params.length > 0 && typeof params[params.length - 1] === 'string') {
      context = params.pop() as string;
    }

    if (
      level === 'error' &&
      params.length > 0 &&
      typeof params[params.length - 1] === 'string'
    ) {
      stack = params.pop() as string;
    }

    return {
      context,
      stack,
      metadata: params.map((param) => this.normalizeMessage(param)),
    };
  }

  private print(entry: LogEntry): void {
    const stream =
      entry.level === 'error' || entry.level === 'fatal'
        ? process.stderr
        : process.stdout;

    if (this.format === 'pretty') {
      stream.write(`${this.formatPretty(entry)}\n`);
      return;
    }

    stream.write(`${JSON.stringify(this.removeEmptyFields(entry))}\n`);
  }

  private formatPretty(entry: LogEntry): string {
    const context = entry.context ? ` [${entry.context}]` : '';
    const requestId = entry.requestId ? ` requestId=${entry.requestId}` : '';
    const request =
      entry.method && entry.path ? ` ${entry.method} ${entry.path}` : '';
    const metadata = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
    const stack = entry.stack ? `\n${entry.stack}` : '';

    return `${entry.timestamp} ${entry.level.toUpperCase()}${context}${requestId}${request} ${String(entry.message)}${metadata}${stack}`;
  }

  private normalizeMessage(message: unknown): unknown {
    if (message instanceof Error) {
      return {
        name: message.name,
        message: message.message,
        stack: message.stack,
      };
    }

    return message;
  }

  private removeEmptyFields(entry: LogEntry): Partial<LogEntry> {
    return Object.fromEntries(
      Object.entries(entry).filter(([, value]) => value !== undefined),
    ) as Partial<LogEntry>;
  }

  private isLevelEnabled(level: LogLevel | 'fatal'): boolean {
    if (level === 'fatal') {
      return this.levels.includes('error');
    }

    return this.levels.includes(level);
  }

  private resolveLogLevels(): LogLevel[] {
    const configuredLevel = this.configService
      .get<string>('LOG_LEVEL')
      ?.toLowerCase();

    switch (configuredLevel) {
      case 'fatal':
      case 'error':
        return ['error'];
      case 'warn':
        return ['error', 'warn'];
      case 'info':
      case 'log':
        return ['error', 'warn', 'log'];
      case 'debug':
        return ['error', 'warn', 'log', 'debug'];
      case 'verbose':
      case 'trace':
        return ['error', 'warn', 'log', 'debug', 'verbose'];
      default:
        return this.environment === 'production'
          ? ['error', 'warn', 'log']
          : ['error', 'warn', 'log', 'debug', 'verbose'];
    }
  }

  private resolveFormat(): LogFormat {
    const format = this.configService.get<string>('LOG_FORMAT');

    if (format === 'json' || format === 'pretty') {
      return format;
    }

    return this.environment === 'production' ? 'json' : 'pretty';
  }
}
