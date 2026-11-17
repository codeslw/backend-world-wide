import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // ServiceActorGuard already authenticated an edu-crm service request.
    if (context.switchToHttp().getRequest()?.serviceActor === true) return true;
    return super.canActivate(context);
  }
}
