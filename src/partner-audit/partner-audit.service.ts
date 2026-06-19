import { Injectable, Logger } from '@nestjs/common';
import { PartnerAuditAction, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';

export interface AuditActor {
  /** The acting user's id (partner member/owner, or admin for admin actions). */
  actorId?: string | null;
  actorRole?: Role | null;
  actorName?: string | null;
  /** Owning partner organization for the action. Resolved if omitted. */
  organizationId?: string | null;
  ipAddress?: string | null;
}

export interface AuditEntry extends AuditActor {
  action: PartnerAuditAction;
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

export interface AuditLogQuery {
  organizationId?: string;
  actorId?: string;
  action?: PartnerAuditAction;
  from?: Date;
  to?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class PartnerAuditService {
  private readonly logger = new Logger(PartnerAuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Resolve the organization a partner user belongs to (owner or member).
   * Returns null for non-partner actors (e.g. admins acting on an org we pass
   * explicitly).
   */
  private async resolveOrganizationId(
    userId?: string | null,
  ): Promise<string | null> {
    if (!userId) return null;
    const owned = await this.prisma.partnerOrganization.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });
    if (owned) return owned.id;
    const member = await this.prisma.partnerMember.findUnique({
      where: { userId },
      select: { organizationId: true },
    });
    return member?.organizationId ?? null;
  }

  private async resolveActorName(
    userId?: string | null,
    fallback?: string | null,
  ): Promise<string | null> {
    if (fallback) return fallback;
    if (!userId) return null;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        profile: { select: { firstName: true, lastName: true } },
      },
    });
    if (!user) return null;
    const name = [user.profile?.firstName, user.profile?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return name || user.email || null;
  }

  /**
   * Record an audit entry. Best-effort: failures are logged but never bubble up
   * so auditing can never break the action being audited.
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      const organizationId =
        entry.organizationId ??
        (await this.resolveOrganizationId(entry.actorId));
      const actorName = await this.resolveActorName(
        entry.actorId,
        entry.actorName,
      );

      await this.prisma.partnerAuditLog.create({
        data: {
          action: entry.action,
          actorId: entry.actorId ?? null,
          actorRole: entry.actorRole ?? null,
          actorName,
          organizationId: organizationId ?? null,
          targetType: entry.targetType ?? null,
          targetId: entry.targetId ?? null,
          targetLabel: entry.targetLabel ?? null,
          metadata: entry.metadata ?? Prisma.JsonNull,
          ipAddress: entry.ipAddress ?? null,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to write partner audit log (${entry.action}): ${
          (err as Error).message
        }`,
      );
    }
  }

  private buildWhere(query: AuditLogQuery): Prisma.PartnerAuditLogWhereInput {
    const where: Prisma.PartnerAuditLogWhereInput = {};
    if (query.organizationId) where.organizationId = query.organizationId;
    if (query.actorId) where.actorId = query.actorId;
    if (query.action) where.action = query.action;
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from && { gte: query.from }),
        ...(query.to && { lte: query.to }),
      };
    }
    if (query.search) {
      where.OR = [
        { actorName: { contains: query.search, mode: 'insensitive' } },
        { targetLabel: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  async find(query: AuditLogQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const where = this.buildWhere(query);

    const [total, items] = await Promise.all([
      this.prisma.partnerAuditLog.count({ where }),
      this.prisma.partnerAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
          organization: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
