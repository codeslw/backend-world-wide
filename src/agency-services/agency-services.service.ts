import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateAgencyServiceDto } from './dto/create-agency-service.dto';
import { UpdateAgencyServiceDto } from './dto/update-agency-service.dto';

@Injectable()
export class AgencyServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateAgencyServiceDto) {
    const { universityIds, ...data } = createDto;
    return this.prisma.agencyService.create({
      data: {
        ...data,
        tariffs: createDto.tariffs as any,
        universities: universityIds ? {
          connect: universityIds.map(id => ({ id }))
        } : undefined
      },
      include: { universities: true }
    });
  }

  async findAll() {
    return this.prisma.agencyService.findMany({
      include: { universities: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.agencyService.findUnique({
      where: { id },
      include: { universities: true }
    });
    if (!service) throw new NotFoundException(`Agency service with ID ${id} not found`);
    return service;
  }

  async update(id: string, updateDto: UpdateAgencyServiceDto) {
    const { universityIds, ...data } = updateDto;
    return this.prisma.agencyService.update({
      where: { id },
      data: {
        ...data,
        tariffs: updateDto.tariffs as any,
        universities: universityIds ? {
          set: universityIds.map(id => ({ id }))
        } : undefined
      },
      include: { universities: true }
    });
  }

  async remove(id: string) {
    return this.prisma.agencyService.delete({
      where: { id },
    });
  }
}
