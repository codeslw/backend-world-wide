import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { PartnerOrganizationsService } from '../partner-organizations/partner-organizations.service';
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
  constructor(
    private prisma: PrismaService,
    private partnerOrgsService: PartnerOrganizationsService,
  ) {}

  async findAll(ownerUserId: string) {
    const org = await this.partnerOrgsService.getOrCreateForOwner(ownerUserId);

    const ownerUser = await this.prisma.user.findUnique({
      where: { id: ownerUserId },
      include: { profile: true },
    });

    const members = await this.prisma.partnerMember.findMany({
      where: { organizationId: org.id },
      include: { user: { include: { profile: true } }, permissions: true },
      orderBy: { createdAt: 'asc' },
    });

    const ownerRow = {
      id: ownerUserId,
      userId: ownerUserId,
      email: ownerUser.email,
      firstName: ownerUser.profile?.firstName || '',
      lastName: ownerUser.profile?.lastName || '',
      role: PartnerRole.OWNER,
      permissions: [],
      createdAt: ownerUser.createdAt,
    };

    const memberRows = members.map(m => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      firstName: m.user.profile?.firstName || '',
      lastName: m.user.profile?.lastName || '',
      role: m.role,
      permissions: m.permissions,
      createdAt: m.createdAt,
    }));

    return [ownerRow, ...memberRows];
  }

  async create(ownerUserId: string, dto: CreatePartnerMemberDto) {
    const org = await this.partnerOrgsService.getOrCreateForOwner(ownerUserId);

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
        organizationId: org.id,
        role: dto.role,
      },
      include: { user: { include: { profile: true } }, permissions: true },
    });

    return {
      id: member.id,
      userId: member.userId,
      email: member.user.email,
      firstName: member.user.profile?.firstName || '',
      lastName: member.user.profile?.lastName || '',
      role: member.role,
      permissions: member.permissions,
      createdAt: member.createdAt,
    };
  }

  async remove(ownerUserId: string, memberId: string) {
    const org = await this.partnerOrgsService.getOrCreateForOwner(ownerUserId);
    const member = await this.prisma.partnerMember.findUnique({
      where: { id: memberId },
    });
    if (!member) throw new EntityNotFoundException('PartnerMember', memberId);
    if (member.organizationId !== org.id) throw new ForbiddenActionException();

    await this.prisma.user.delete({ where: { id: member.userId } });
  }

  async getPermissions(ownerUserId: string, memberId: string) {
    const org = await this.partnerOrgsService.getOrCreateForOwner(ownerUserId);
    const member = await this.prisma.partnerMember.findUnique({
      where: { id: memberId },
      include: { permissions: true },
    });
    if (!member) throw new EntityNotFoundException('PartnerMember', memberId);
    if (member.organizationId !== org.id) throw new ForbiddenActionException();
    return member.permissions;
  }

  async setPermissions(ownerUserId: string, memberId: string, dto: SetPermissionsDto) {
    const org = await this.partnerOrgsService.getOrCreateForOwner(ownerUserId);
    const member = await this.prisma.partnerMember.findUnique({
      where: { id: memberId },
    });
    if (!member) throw new EntityNotFoundException('PartnerMember', memberId);
    if (member.organizationId !== org.id) throw new ForbiddenActionException();
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

    return this.getPermissions(ownerUserId, memberId);
  }
}
