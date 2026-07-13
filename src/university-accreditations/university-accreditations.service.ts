import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Accreditation,
  RankingOrganization,
  UniversityAccreditation,
  UniversityRanking,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { DigitalOceanService } from '../digital-ocean/digital-ocean.service';
import { SetUniversityAccreditationsDto } from './dto/set-university-accreditations.dto';
import { CreateUniversityRankingDto } from './dto/create-university-ranking.dto';
import { UpdateUniversityRankingDto } from './dto/update-university-ranking.dto';

type AccreditationJoinWithCatalog = UniversityAccreditation & {
  accreditation: Accreditation;
};
type RankingWithOrganization = UniversityRanking & {
  organization: RankingOrganization;
};

@Injectable()
export class UniversityAccreditationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly digitalOceanService: DigitalOceanService,
  ) {}

  /** Public: everything needed to render a university's accreditations + rankings. */
  async getForUniversity(universityId: string) {
    await this.assertUniversityExists(universityId);

    const [accreditations, rankings] = await Promise.all([
      this.prisma.universityAccreditation.findMany({
        where: { universityId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: { accreditation: true },
      }),
      this.prisma.universityRanking.findMany({
        where: { universityId },
        orderBy: [{ sortOrder: 'asc' }, { rank: 'asc' }],
        include: { organization: true },
      }),
    ]);

    return {
      accreditations: accreditations.map((row) =>
        this.normalizeAccreditationJoin(row),
      ),
      rankings: rankings.map((row) => this.normalizeRanking(row)),
    };
  }

  /** Admin: replace the full set of attached accreditations (idempotent). */
  async setAccreditations(
    universityId: string,
    dto: SetUniversityAccreditationsDto,
  ) {
    await this.assertUniversityExists(universityId);

    const uniqueIds = [...new Set(dto.accreditationIds)];

    if (uniqueIds.length) {
      const found = await this.prisma.accreditation.count({
        where: { id: { in: uniqueIds } },
      });
      if (found !== uniqueIds.length) {
        throw new NotFoundException(
          'One or more accreditation ids do not exist',
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.universityAccreditation.deleteMany({
        where: {
          universityId,
          accreditationId: { notIn: uniqueIds.length ? uniqueIds : [''] },
        },
      }),
      ...uniqueIds.map((accreditationId, index) =>
        this.prisma.universityAccreditation.upsert({
          where: {
            universityId_accreditationId: { universityId, accreditationId },
          },
          create: { universityId, accreditationId, sortOrder: index },
          update: { sortOrder: index },
        }),
      ),
    ]);

    return this.getForUniversity(universityId);
  }

  /** Admin: add a ranking for a university from a specific organization. */
  async createRanking(
    universityId: string,
    dto: CreateUniversityRankingDto,
  ): Promise<RankingWithOrganization> {
    await this.assertUniversityExists(universityId);
    await this.assertOrganizationExists(dto.rankingOrganizationId);

    try {
      const ranking = await this.prisma.universityRanking.create({
        data: {
          universityId,
          rankingOrganizationId: dto.rankingOrganizationId,
          rank: dto.rank,
          score: dto.score,
          category: dto.category,
          year: dto.year,
          sortOrder: dto.sortOrder ?? 0,
        },
        include: { organization: true },
      });
      return this.normalizeRanking(ranking);
    } catch (error) {
      throw this.mapRankingUniqueError(error);
    }
  }

  /** Admin: update a ranking row. */
  async updateRanking(
    universityId: string,
    rankingId: string,
    dto: UpdateUniversityRankingDto,
  ): Promise<RankingWithOrganization> {
    await this.assertRankingBelongsToUniversity(universityId, rankingId);
    if (dto.rankingOrganizationId) {
      await this.assertOrganizationExists(dto.rankingOrganizationId);
    }

    try {
      const updated = await this.prisma.universityRanking.update({
        where: { id: rankingId },
        data: {
          rankingOrganizationId: dto.rankingOrganizationId,
          rank: dto.rank,
          score: dto.score,
          category: dto.category,
          year: dto.year,
          sortOrder: dto.sortOrder,
        },
        include: { organization: true },
      });
      return this.normalizeRanking(updated);
    } catch (error) {
      throw this.mapRankingUniqueError(error);
    }
  }

  /** Admin: delete a ranking row. */
  async removeRanking(
    universityId: string,
    rankingId: string,
  ): Promise<UniversityRanking> {
    await this.assertRankingBelongsToUniversity(universityId, rankingId);
    return this.prisma.universityRanking.delete({ where: { id: rankingId } });
  }

  // --- helpers ---

  private async assertUniversityExists(universityId: string) {
    const university = await this.prisma.university.findUnique({
      where: { id: universityId },
      select: { id: true },
    });
    if (!university) {
      throw new NotFoundException(`University ${universityId} not found`);
    }
  }

  private async assertOrganizationExists(organizationId: string) {
    const organization = await this.prisma.rankingOrganization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!organization) {
      throw new NotFoundException(
        `Ranking organization ${organizationId} not found`,
      );
    }
  }

  private async assertRankingBelongsToUniversity(
    universityId: string,
    rankingId: string,
  ) {
    const ranking = await this.prisma.universityRanking.findUnique({
      where: { id: rankingId },
      select: { id: true, universityId: true },
    });
    if (!ranking || ranking.universityId !== universityId) {
      throw new NotFoundException(`Ranking ${rankingId} not found`);
    }
  }

  private mapRankingUniqueError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(
        'A ranking for this organization and category already exists for this university',
      );
    }
    return error;
  }

  private normalizeAccreditationJoin(
    row: AccreditationJoinWithCatalog,
  ): AccreditationJoinWithCatalog {
    return {
      ...row,
      accreditation: {
        ...row.accreditation,
        imageUrl: this.digitalOceanService.normalizeToPublicUrl(
          row.accreditation.imageUrl,
        ),
      },
    };
  }

  private normalizeRanking(
    row: RankingWithOrganization,
  ): RankingWithOrganization {
    return {
      ...row,
      organization: {
        ...row.organization,
        imageUrl: this.digitalOceanService.normalizeToPublicUrl(
          row.organization.imageUrl,
        ),
      },
    };
  }
}
