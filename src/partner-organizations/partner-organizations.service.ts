import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class PartnerOrganizationsService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateForOwner(userId: string): Promise<{ id: string; ownerId: string }> {
    const existing = await this.prisma.partnerOrganization.findUnique({
      where: { ownerId: userId },
    });
    if (existing) return existing;
    return this.prisma.partnerOrganization.create({
      data: { ownerId: userId },
    });
  }

  async findByMemberUserId(userId: string): Promise<{ organizationId: string; role: string; permissions: { action: string; granted: boolean }[] } | null> {
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
}
