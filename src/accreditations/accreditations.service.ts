import { Injectable, NotFoundException } from '@nestjs/common';
import { Accreditation } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { DigitalOceanService } from '../digital-ocean/digital-ocean.service';
import { CreateAccreditationDto } from './dto/create-accreditation.dto';
import { UpdateAccreditationDto } from './dto/update-accreditation.dto';

@Injectable()
export class AccreditationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly digitalOceanService: DigitalOceanService,
  ) {}

  async create(dto: CreateAccreditationDto): Promise<Accreditation> {
    const accreditation = await this.prisma.accreditation.create({
      data: {
        ...dto,
        imageUrl: this.digitalOceanService.normalizeToPublicUrl(dto.imageUrl),
      },
    });
    return this.normalize(accreditation);
  }

  async findAll(): Promise<Accreditation[]> {
    const accreditations = await this.prisma.accreditation.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return accreditations.map((a) => this.normalize(a));
  }

  async findOne(id: string): Promise<Accreditation> {
    const accreditation = await this.prisma.accreditation.findUnique({
      where: { id },
    });
    if (!accreditation)
      throw new NotFoundException(`Accreditation ${id} not found`);
    return this.normalize(accreditation);
  }

  async update(
    id: string,
    dto: UpdateAccreditationDto,
  ): Promise<Accreditation> {
    const existing = await this.prisma.accreditation.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Accreditation ${id} not found`);

    const updated = await this.prisma.accreditation.update({
      where: { id },
      data: {
        ...dto,
        imageUrl:
          dto.imageUrl === undefined
            ? undefined
            : this.digitalOceanService.normalizeToPublicUrl(dto.imageUrl),
      },
    });
    return this.normalize(updated);
  }

  async remove(id: string): Promise<Accreditation> {
    const existing = await this.prisma.accreditation.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Accreditation ${id} not found`);
    return this.prisma.accreditation.delete({ where: { id } });
  }

  private normalize(accreditation: Accreditation): Accreditation {
    return {
      ...accreditation,
      imageUrl: this.digitalOceanService.normalizeToPublicUrl(
        accreditation.imageUrl,
      ),
    };
  }
}
