import { Injectable, NotFoundException } from '@nestjs/common';
import { RankingOrganization } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { DigitalOceanService } from '../digital-ocean/digital-ocean.service';
import { CreateRankingOrganizationDto } from './dto/create-ranking-organization.dto';
import { UpdateRankingOrganizationDto } from './dto/update-ranking-organization.dto';

@Injectable()
export class RankingOrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly digitalOceanService: DigitalOceanService,
  ) {}

  async create(
    dto: CreateRankingOrganizationDto,
  ): Promise<RankingOrganization> {
    const organization = await this.prisma.rankingOrganization.create({
      data: {
        ...dto,
        imageUrl: this.digitalOceanService.normalizeToPublicUrl(dto.imageUrl),
      },
    });
    return this.normalize(organization);
  }

  async findAll(): Promise<RankingOrganization[]> {
    const organizations = await this.prisma.rankingOrganization.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return organizations.map((o) => this.normalize(o));
  }

  async findOne(id: string): Promise<RankingOrganization> {
    const organization = await this.prisma.rankingOrganization.findUnique({
      where: { id },
    });
    if (!organization)
      throw new NotFoundException(`Ranking organization ${id} not found`);
    return this.normalize(organization);
  }

  async update(
    id: string,
    dto: UpdateRankingOrganizationDto,
  ): Promise<RankingOrganization> {
    const existing = await this.prisma.rankingOrganization.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException(`Ranking organization ${id} not found`);

    const updated = await this.prisma.rankingOrganization.update({
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

  async remove(id: string): Promise<RankingOrganization> {
    const existing = await this.prisma.rankingOrganization.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException(`Ranking organization ${id} not found`);
    return this.prisma.rankingOrganization.delete({ where: { id } });
  }

  private normalize(
    organization: RankingOrganization,
  ): RankingOrganization {
    return {
      ...organization,
      imageUrl: this.digitalOceanService.normalizeToPublicUrl(
        organization.imageUrl,
      ),
    };
  }
}
