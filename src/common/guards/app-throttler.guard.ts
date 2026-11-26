import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  headerOf,
  isServiceToken,
  SERVICE_TOKEN_HEADER,
} from '../utils/service-token.util';

/**
 * The global rate limit, except for edu-crm's backend: all its users' requests
 * come from one address, so a per-address limit would make them share one
 * budget. The CRM limits its own users.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return super.shouldSkip(context);
    const req = context.switchToHttp().getRequest();
    if (
      isServiceToken(
        headerOf(req, SERVICE_TOKEN_HEADER),
        process.env.CRM_SERVICE_TOKEN,
      )
    ) {
      return true;
    }
    return super.shouldSkip(context);
  }
}
