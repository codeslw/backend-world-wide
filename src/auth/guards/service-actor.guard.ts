import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../db/prisma.service';
import { Role } from '../../common/enum/roles.enum';
import {
  headerOf,
  isServiceToken,
  SERVICE_TOKEN_HEADER,
} from '../../common/utils/service-token.util';

export { SERVICE_TOKEN_HEADER };
export const ACT_AS_USER_HEADER = 'x-act-as-user';
export const ACT_AS_STUDENT_HEADER = 'x-act-as-student';

const UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const UUID_RE = new RegExp(`^${UUID}$`, 'i');
const STUDENT_RE = new RegExp(`^(partner|client):(${UUID})$`, 'i');

/** A student edu-crm acts for (their personal link), who may have no account here. */
export interface StudentActor {
  /** partner: a partner_students row. client: a CLIENT user. */
  kind: 'partner' | 'client';
  id: string;
  name: string;
}

/**
 * Lets edu-crm's backend call an endpoint on behalf of one of its users, or of
 * a student who opened their personal link.
 *
 * The CRM sends `X-Service-Token: <CRM_SERVICE_TOKEN>` and either
 * `X-Act-As-User: <world-wide user id>` (an admin, see docs/student-events.md)
 * or `X-Act-As-Student: partner:<student id>` / `client:<user id>`. The guard
 * then sets `req.user` as the JWT strategy would, so the endpoint's own access
 * rules apply unchanged; a student acts with the CLIENT role and
 * `req.studentActor` says which one. `JwtAuthGuard` lets such a request through
 * without a bearer token.
 *
 * Requests without the header are left to `JwtAuthGuard`. The guard is only
 * put on the endpoints the CRM needs (documents and file upload).
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
    const token = headerOf(req, SERVICE_TOKEN_HEADER);
    if (token === undefined) return true; // a normal user request

    if (!isServiceToken(token, this.config.get<string>('CRM_SERVICE_TOKEN'))) {
      this.logger.warn('Rejected a request with an invalid service token');
      throw new UnauthorizedException('Invalid service token');
    }

    const student = headerOf(req, ACT_AS_STUDENT_HEADER);
    if (student !== undefined) {
      await this.actAsStudent(req, student);
    } else {
      await this.actAsUser(req, headerOf(req, ACT_AS_USER_HEADER));
    }
    req.serviceActor = true;
    return true;
  }

  private async actAsStudent(req: any, value: string) {
    const match = STUDENT_RE.exec(value);
    if (!match) {
      throw new UnauthorizedException(
        `${ACT_AS_STUDENT_HEADER} must be partner:<id> or client:<id>`,
      );
    }
    const kind = match[1].toLowerCase() as StudentActor['kind'];
    const id = match[2];
    let name = '';
    let userId: string | null = null;
    if (kind === 'partner') {
      const row = await this.prisma.partnerStudent.findUnique({
        where: { id },
        select: { firstName: true, lastName: true },
      });
      if (!row) throw new UnauthorizedException('Unknown student');
      name = `${row.firstName} ${row.lastName}`.trim();
    } else {
      const row = await this.prisma.user.findUnique({
        where: { id },
        select: {
          role: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      });
      if (!row || row.role !== Role.CLIENT) {
        throw new UnauthorizedException('Unknown student');
      }
      userId = id;
      name =
        [row.profile?.firstName, row.profile?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() || row.email;
    }
    req.user = { userId, email: null, role: Role.CLIENT };
    req.studentActor = { kind, id, name } satisfies StudentActor;
  }

  private async actAsUser(req: any, userId: string | undefined) {
    if (!userId || !UUID_RE.test(userId)) {
      throw new UnauthorizedException(
        `${ACT_AS_USER_HEADER} must be a user id`,
      );
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
  }
}
