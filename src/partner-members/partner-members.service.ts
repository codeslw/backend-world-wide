import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreatePartnerMemberDto } from './dto/create-partner-member.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';
import {
  ConflictException,
  EntityNotFoundException,
  ForbiddenActionException,
} from '../common/exceptions/app.exceptions';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enum/roles.enum';
import { PartnerRole } from '@prisma/client';

@Injectable()
export class PartnerMembersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    const org = await this.prisma.partnerOrganization.findUnique({
      where: { id: organizationId },
      include: { owner: { include: { profile: true } } },
    });
    if (!org) throw new EntityNotFoundException('PartnerOrganization', organizationId);

    const members = await this.prisma.partnerMember.findMany({
      where: { organizationId },
      include: { user: { include: { profile: true } }, permissions: true },
      orderBy: { createdAt: 'asc' },
    });

    const ownerRow = {
      id: org.ownerId,
      userId: org.ownerId,
      email: org.owner.email,
      firstName: (org.owner as any).profile?.firstName || '',
      lastName: (org.owner as any).profile?.lastName || '',
      role: PartnerRole.OWNER,
      permissions: [],
      createdAt: org.owner.createdAt,
    };

    const memberRows = members.map(m => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      firstName: (m.user as any).profile?.firstName || '',
      lastName: (m.user as any).profile?.lastName || '',
      role: m.role,
      permissions: m.permissions,
      createdAt: m.createdAt,
    }));

    return [ownerRow, ...memberRows];
  }

  async create(organizationId: string, dto: CreatePartnerMemberDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(`Email ${dto.email} is already in use`);
    }

    const hashedPassword = await bcrypt.hash(dto.temporaryPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: Role.PARTNER,
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
          },
        },
      },
    });

    const member = await this.prisma.partnerMember.create({
      data: {
        userId: user.id,
        organizationId,
        role: dto.role,
      },
      include: { user: { include: { profile: true } }, permissions: true },
    });

    return {
      id: member.id,
      userId: member.userId,
      email: member.user.email,
      firstName: (member.user as any).profile?.firstName || '',
      lastName: (member.user as any).profile?.lastName || '',
      role: member.role,
      permissions: member.permissions,
      createdAt: member.createdAt,
    };
  }

  async remove(organizationId: string, memberId: string) {
    const member = await this.prisma.partnerMember.findUnique({
      where: { id: memberId },
    });
    if (!member) throw new EntityNotFoundException('PartnerMember', memberId);
    if (member.organizationId !== organizationId) throw new ForbiddenActionException();

    await this.prisma.user.delete({ where: { id: member.userId } });
  }

  async getPermissions(organizationId: string, memberId: string) {
    const member = await this.prisma.partnerMember.findUnique({
      where: { id: memberId },
      include: { permissions: true },
    });
    if (!member) throw new EntityNotFoundException('PartnerMember', memberId);
    if (member.organizationId !== organizationId) throw new ForbiddenActionException();
    return member.permissions;
  }

  async setPermissions(organizationId: string, memberId: string, dto: SetPermissionsDto) {
    const member = await this.prisma.partnerMember.findUnique({
      where: { id: memberId },
    });
    if (!member) throw new EntityNotFoundException('PartnerMember', memberId);
    if (member.organizationId !== organizationId) throw new ForbiddenActionException();
    if (member.role !== 'MEMBER') {
      throw new ForbiddenActionException('Can only set permissions for MEMBER role');
    }

    await Promise.all(
      dto.permissions.map(p =>
        this.prisma.partnerPermission.upsert({
          where: { memberId_action: { memberId, action: p.action } },
          update: { granted: p.granted },
          create: { memberId, action: p.action, granted: p.granted },
        }),
      ),
    );

    return this.getPermissions(organizationId, memberId);
  }
}
