import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { PartnerAction, PartnerRole } from '@prisma/client';
import { SetMemberPermissionsDto } from './dto/set-member-permissions.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class PartnerOrganizationsService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateForOwner(
    userId: string,
  ): Promise<{ id: string; ownerId: string }> {
    const existing = await this.prisma.partnerOrganization.findUnique({
      where: { ownerId: userId },
    });
    if (existing) return existing;
    return this.prisma.partnerOrganization.create({
      data: { ownerId: userId },
    });
  }

  async findByMemberUserId(
    userId: string,
  ): Promise<{
    organizationId: string;
    role: string;
    permissions: { action: string; granted: boolean }[];
  } | null> {
    const member = await this.prisma.partnerMember.findUnique({
      where: { userId },
      include: { permissions: true },
    });
    if (!member) return null;
    return {
      organizationId: member.organizationId,
      role: member.role,
      permissions: member.permissions,
    };
  }

  /**
   * Resolve the organization a partner user belongs to, whether they are the
   * owner or a member.
   */
  async findOrgIdForUser(userId: string): Promise<string | null> {
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

  /**
   * All partner User ids that belong to an organization — the owner plus every
   * member. Used to scope students/applications across the whole agency rather
   * than to a single employee.
   */
  async getOrgUserIds(organizationId: string): Promise<string[]> {
    const org = await this.prisma.partnerOrganization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true, members: { select: { userId: true } } },
    });
    if (!org) return [];
    return [org.ownerId, ...org.members.map((m) => m.userId)];
  }

  /**
   * Given the partner User ids in scope for a viewer, restrict to only those
   * the viewer is allowed to see. Owners/managers (no membership row, or a
   * MEMBER role with VIEW_STUDENTS) see all org students; a plain MEMBER without
   * VIEW_STUDENTS sees only their own.
   */
  async resolveVisiblePartnerIds(userId: string): Promise<string[]> {
    const orgId = await this.findOrgIdForUser(userId);
    if (!orgId) return [userId];

    const member = await this.prisma.partnerMember.findUnique({
      where: { userId },
      include: { permissions: true },
    });

    // Owner (no membership row) or non-MEMBER role → full org visibility.
    if (!member || member.role !== 'MEMBER') {
      return this.getOrgUserIds(orgId);
    }

    const canViewAll = member.permissions.some(
      (p) => p.action === PartnerAction.VIEW_STUDENTS && p.granted,
    );
    return canViewAll ? this.getOrgUserIds(orgId) : [userId];
  }

  // ----- Admin: partner organizations management -----

  async findAllForAdmin() {
    const orgs = await this.prisma.partnerOrganization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        _count: { select: { members: true } },
      },
    });

    // Student / application counts are keyed by the partner User ids, so resolve
    // per-org and tally.
    return Promise.all(
      orgs.map(async (org) => {
        const userIds = await this.getOrgUserIds(org.id);
        const [studentsCount, applicationsCount] = await Promise.all([
          this.prisma.partnerStudent.count({
            where: { partnerId: { in: userIds } },
          }),
          this.prisma.partnerApplication.count({
            where: { partnerId: { in: userIds } },
          }),
        ]);
        return {
          ...org,
          // members count + the owner
          membersCount: org._count.members + 1,
          studentsCount,
          applicationsCount,
        };
      }),
    );
  }

  async findOneForAdmin(id: string) {
    const org = await this.prisma.partnerOrganization.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
            permissions: true,
          },
        },
      },
    });
    if (!org) {
      throw new NotFoundException('Partner organization not found');
    }
    return org;
  }

  async setActive(id: string, isActive: boolean) {
    const existing = await this.prisma.partnerOrganization.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Partner organization not found');
    }
    return this.prisma.partnerOrganization.update({
      where: { id },
      data: { isActive },
    });
  }

  /**
   * Admin: set a MEMBER's permissions for an organization. Upserts
   * PartnerPermission rows. Only MEMBER role permissions are editable —
   * OWNER/MANAGER have full access so their permission set is irrelevant.
   */
  async setMemberPermissions(
    organizationId: string,
    memberId: string,
    dto: SetMemberPermissionsDto,
  ) {
    const member = await this.prisma.partnerMember.findUnique({
      where: { id: memberId },
      select: { id: true, organizationId: true, role: true },
    });
    if (!member || member.organizationId !== organizationId) {
      throw new NotFoundException('Partner member not found');
    }
    if (member.role !== PartnerRole.MEMBER) {
      throw new BadRequestException(
        'Permissions can only be set for MEMBER role',
      );
    }

    await Promise.all(
      dto.permissions.map((p) =>
        this.prisma.partnerPermission.upsert({
          where: { memberId_action: { memberId, action: p.action } },
          update: { granted: p.granted },
          create: { memberId, action: p.action, granted: p.granted },
        }),
      ),
    );

    return this.prisma.partnerPermission.findMany({ where: { memberId } });
  }

  /**
   * Admin: change a member's role between MANAGER and MEMBER. The OWNER role is
   * immutable and cannot be assigned via this method.
   */
  async updateMemberRole(
    organizationId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const member = await this.prisma.partnerMember.findUnique({
      where: { id: memberId },
      select: { id: true, organizationId: true, role: true },
    });
    if (!member || member.organizationId !== organizationId) {
      throw new NotFoundException('Partner member not found');
    }
    if (member.role === PartnerRole.OWNER) {
      throw new BadRequestException('Cannot change the role of the OWNER');
    }

    return this.prisma.partnerMember.update({
      where: { id: memberId },
      data: { role: dto.role as PartnerRole },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        permissions: true,
      },
    });
  }

  /** Whether the user's organization (if any) is active. Used to block login. */
  async isUserOrgActive(userId: string): Promise<boolean> {
    const orgId = await this.findOrgIdForUser(userId);
    if (!orgId) return true;
    const org = await this.prisma.partnerOrganization.findUnique({
      where: { id: orgId },
      select: { isActive: true },
    });
    return org?.isActive ?? true;
  }
}
