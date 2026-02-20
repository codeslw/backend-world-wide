import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';
import { Campus } from '@prisma/client';

@Injectable()
export class CampusesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCampusDto: CreateCampusDto): Promise<Campus> {
    const university = await this.prisma.university.findUnique({
      where: { id: createCampusDto.universityId },
    });
    if (!university) {
      throw new NotFoundException(
        `University with ID ${createCampusDto.universityId} not found`,
      );
    }
    return this.prisma.campus.create({
      data: createCampusDto,
    });
  }

  async findAll(universityId?: string): Promise<Campus[]> {
    const where = universityId ? { universityId } : {};
    return this.prisma.campus.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Campus> {
    const campus = await this.prisma.campus.findUnique({
      where: { id },
      include: {
        university: {
          select: { id: true, name: true },
        },
      },
    });
    if (!campus) {
      throw new NotFoundException(`Campus with ID ${id} not found`);
    }
    return campus;
  }

  async update(id: string, updateCampusDto: UpdateCampusDto): Promise<Campus> {
    await this.findOne(id);
    return this.prisma.campus.update({
      where: { id },
      data: updateCampusDto,
    });
  }

  async remove(id: string): Promise<Campus> {
    await this.findOne(id);
    return this.prisma.campus.delete({
      where: { id },
    });
  }
}
