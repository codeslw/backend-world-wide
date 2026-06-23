import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { Milestone } from '@prisma/client';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Injectable()
export class MilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMilestoneDto): Promise<Milestone> {
    return this.prisma.milestone.create({ data: dto });
  }

  findAll(): Promise<Milestone[]> {
    return this.prisma.milestone.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string): Promise<Milestone> {
    const milestone = await this.prisma.milestone.findUnique({ where: { id } });
    if (!milestone) throw new NotFoundException(`Milestone ${id} not found`);
    return milestone;
  }

  async update(id: string, dto: UpdateMilestoneDto): Promise<Milestone> {
    const existing = await this.prisma.milestone.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Milestone ${id} not found`);
    return this.prisma.milestone.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<Milestone> {
    const existing = await this.prisma.milestone.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Milestone ${id} not found`);
    return this.prisma.milestone.delete({ where: { id } });
  }
}
