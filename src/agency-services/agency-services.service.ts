import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateAgencyServiceDto } from './dto/create-agency-service.dto';
import { UpdateAgencyServiceDto } from './dto/update-agency-service.dto';

@Injectable()
export class AgencyServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateAgencyServiceDto) {
    return this.prisma.agencyService.create({
      data: {
        name: createDto.name,
        basic: createDto.basic as any,
        standard: createDto.standard as any,
        premium: createDto.premium as any,
      },
    });
  }

  async findAll() {
    return this.prisma.agencyService.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.agencyService.findUnique({
      where: { id },
    });
    if (!service) throw new NotFoundException(`Agency service with ID ${id} not found`);
    return service;
  }

  async update(id: string, updateDto: UpdateAgencyServiceDto) {
    return this.prisma.agencyService.update({
      where: { id },
      data: {
        name: updateDto.name,
        basic: updateDto.basic as any,
        standard: updateDto.standard as any,
        premium: updateDto.premium as any,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.agencyService.delete({
      where: { id },
    });
  }
}
