import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { PrismaService } from '../../db/prisma.service';
import { Role } from '../../common/enum/roles.enum';

export const SERVICE_TOKEN_HEADER = 'x-service-token';
export const ACT_AS_USER_HEADER = 'x-act-as-user';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Shortest service token accepted, so a weak or placeholder value can't be used. */
const MIN_TOKEN_LENGTH = 32;

/**
 * Lets edu-crm's backend call an endpoint on behalf of one of its users.
 *
 * The CRM sends `X-Service-Token: <CRM_SERVICE_TOKEN>` and
 * `X-Act-As-User: <world-wide user id>` (every CRM login mirrors a world-wide
 * user, see docs/partner-events.md). The guard then sets `req.user` exactly as
 * the JWT strategy would for that user, so the endpoint's own access rules
 * (roles, partner visibility) apply unchanged. `JwtAuthGuard` lets such a
 * request through without a bearer token.
 *
 * Requests without the header are left to `JwtAuthGuard`. The guard is only
 * put on the endpoints the CRM needs (application documents and file upload);
 * see docs/student-events.md.
 */
@Injectable()
export class ServiceActorGuard implements CanActivate {
  private readonly logger = new Logger(ServiceActorGuard.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = header(req, SERVICE_TOKEN_HEADER);
    if (token === undefined) return true; // a normal user request

    const expected = this.config.get<string>('CRM_SERVICE_TOKEN') ?? '';
    if (expected.length < MIN_TOKEN_LENGTH || !sameSecret(token, expected)) {
      this.logger.warn('Rejected a request with an invalid service token');
      throw new UnauthorizedException('Invalid service token');
    }

    const userId = header(req, ACT_AS_USER_HEADER);
    if (!userId || !UUID_RE.test(userId)) {
      throw new UnauthorizedException(`${ACT_AS_USER_HEADER} must be a user id`);
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        partnerOrganization: { select: { id: true, isActive: true } },
        partnerMembership: {
          select: {
            role: true,
            permissions: true,
            organization: { select: { id: true, isActive: true } },
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException('Unknown user');
    if (user.role !== Role.PARTNER && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only partner and admin accounts can act');
    }

    const org =
      user.partnerOrganization ?? user.partnerMembership?.organization ?? null;
    if (user.role === Role.PARTNER && org && !org.isActive) {
      throw new ForbiddenException('The partner organization is deactivated');
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: org?.id ?? null,
      partnerRole: user.partnerOrganization
        ? 'OWNER'
        : (user.partnerMembership?.role ?? null),
      permissions: user.partnerMembership?.permissions ?? [],
    };
    req.serviceActor = true;
    return true;
  }
}

function header(req: any, name: string): string | undefined {
  const value = req.headers?.[name];
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : undefined;
}

function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
