import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  headerOf,
  isServiceToken,
  SERVICE_TOKEN_HEADER,
} from '../common/utils/service-token.util';

/** Only edu-crm's backend, which sends `X-Service-Token: <CRM_SERVICE_TOKEN>`. */
@Injectable()
export class CrmServiceGuard implements CanActivate {
  private readonly logger = new Logger(CrmServiceGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = headerOf(req, SERVICE_TOKEN_HEADER);
    if (isServiceToken(token, this.config.get<string>('CRM_SERVICE_TOKEN'))) {
      return true;
    }
    this.logger.warn('Rejected a CRM request with an invalid service token');
    throw new UnauthorizedException('Invalid service token');
  }
}
