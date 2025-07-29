import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProfilesRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProfileCreateInput) {
    return this.prisma.profile.create({
      data,
    });
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: any;
    include?: any;
  }) {
    const { skip, take, orderBy, where, include } = options || {};

    return this.prisma.profile.findMany({
      skip,
      take,
      orderBy,
      where,
      include,
    });
  }

  async count(where?: any) {
    return this.prisma.profile.count({ where });
  }

  async findById(id: string, include?: any) {
    return this.prisma.profile.findUnique({
      where: { id },
      include,
    });
  }

  async findByUserId(userId: string, include?: any) {
    return this.prisma.profile.findUnique({
      where: { userId },
      include,
    });
  }

  async update(id: string, data: Prisma.ProfileUpdateInput) {
    return this.prisma.profile.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.profile.delete({
      where: { id },
    });
  }
}
