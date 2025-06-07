import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesRepository {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createProfileDto: CreateProfileDto) {
    return this.prisma.profile.create({
      data: {
        ...createProfileDto,
        userId,
      },
    });
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: any;
  }) {
    const { skip, take, orderBy, where } = options || {};

    return this.prisma.profile.findMany({
      skip,
      take,
      orderBy,
      where,
    });
  }

  async count(where?: any) {
    return this.prisma.profile.count({ where });
  }

  async findById(id: string) {
    return this.prisma.profile.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.profile.findUnique({
      where: { userId },
    });
  }

  async update(id: string, updateProfileDto: UpdateProfileDto) {
    return this.prisma.profile.update({
      where: { id },
      data: updateProfileDto,
    });
  }

  async remove(id: string) {
    return this.prisma.profile.delete({
      where: { id },
    });
  }
}
