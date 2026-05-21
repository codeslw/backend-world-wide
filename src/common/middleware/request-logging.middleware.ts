import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AppLoggerService } from '../logger/app-logger.service';
import { LogContextService } from '../logger/log-context.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly logContextService: LogContextService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const user = (
        req as Request & { user?: { userId?: string; id?: string } }
      ).user;

      this.logContextService.update({
        userId: user?.userId ?? user?.id,
      });

      const payload = {
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
        contentLength: res.getHeader('content-length'),
      };

      if (res.statusCode >= 500) {
        this.logger.error(
          'HTTP request completed',
          payload,
          RequestLoggingMiddleware.name,
        );
      } else if (res.statusCode >= 400) {
        this.logger.warn(
          'HTTP request completed',
          payload,
          RequestLoggingMiddleware.name,
        );
      } else {
        this.logger.log(
          'HTTP request completed',
          payload,
          RequestLoggingMiddleware.name,
        );
      }
    });

    next();
  }
}
