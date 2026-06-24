import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { DigitalOceanService } from '../../digital-ocean/digital-ocean.service';
import { Founder } from '@prisma/client';
import { CreateFounderDto } from './dto/create-founder.dto';
import { UpdateFounderDto } from './dto/update-founder.dto';
import { RevalidationService } from '../revalidation.service';

@Injectable()
export class FoundersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly digitalOceanService: DigitalOceanService,
    private readonly revalidation: RevalidationService,
  ) {}

  async create(dto: CreateFounderDto): Promise<Founder> {
    const founder = await this.prisma.founder.create({
      data: {
        ...dto,
        photoUrl: this.digitalOceanService.normalizeToPublicUrl(dto.photoUrl),
      },
    });
    this.revalidation.revalidateAbout();
    return this.normalize(founder);
  }

  async findAll(): Promise<Founder[]> {
    const founders = await this.prisma.founder.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return founders.map((f) => this.normalize(f));
  }

  async findOne(id: string): Promise<Founder> {
    const founder = await this.prisma.founder.findUnique({ where: { id } });
    if (!founder) throw new NotFoundException(`Founder ${id} not found`);
    return this.normalize(founder);
  }

  async update(id: string, dto: UpdateFounderDto): Promise<Founder> {
    const existing = await this.prisma.founder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Founder ${id} not found`);

    const updated = await this.prisma.founder.update({
      where: { id },
      data: {
        ...dto,
        photoUrl:
          dto.photoUrl === undefined
            ? undefined
            : this.digitalOceanService.normalizeToPublicUrl(dto.photoUrl),
      },
    });
    this.revalidation.revalidateAbout();
    return this.normalize(updated);
  }

  async remove(id: string): Promise<Founder> {
    const existing = await this.prisma.founder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Founder ${id} not found`);
    const removed = await this.prisma.founder.delete({ where: { id } });
    this.revalidation.revalidateAbout();
    return removed;
  }

  private normalize(founder: Founder): Founder {
    return {
      ...founder,
      photoUrl: this.digitalOceanService.normalizeToPublicUrl(founder.photoUrl),
    };
  }
}
