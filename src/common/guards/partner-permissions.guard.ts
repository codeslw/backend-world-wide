import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PARTNER_PERMISSION_KEY } from '../decorators/require-partner-permission.decorator';
import { ForbiddenActionException } from '../exceptions/app.exceptions';

@Injectable()
export class PartnerPermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAction = this.reflector.getAllAndOverride<string>(
      PARTNER_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredAction) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user.partnerRole) return true;

    if (user.partnerRole === 'OWNER' || user.partnerRole === 'MANAGER') return true;

    const granted = (user.permissions as string[]).includes(requiredAction);
    if (!granted) {
      throw new ForbiddenActionException(
        `Permission ${requiredAction} is required`,
      );
    }
    return true;
  }
}
