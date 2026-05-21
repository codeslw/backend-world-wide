import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { LogContextService } from '../logger/log-context.service';

const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly logContextService: LogContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const incomingRequestId = req.header(REQUEST_ID_HEADER);
    const requestId = incomingRequestId || randomUUID();

    res.setHeader(REQUEST_ID_HEADER, requestId);

    this.logContextService.run(
      {
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        ip: req.ip,
        userAgent: req.get('user-agent') ?? 'unknown',
      },
      next,
    );
  }
}
