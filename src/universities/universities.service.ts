import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { UniversityFilterDto } from './dto/university-filter.dto';
import { UniversityResponseDto } from './dto/university-response.dto';
import { UniversitiesByProgramsFilterDto } from './dto/universities-by-programs-filter.dto';
import { PaginatedUniversityListItemResponseDto } from './dto/university-list-item.dto';
import {
  EntityNotFoundException,
  InvalidDataException,
} from '../common/exceptions/app.exceptions';
import { UniversitiesMapper } from './universities.mapper';
import { UniversitiesRepository } from './universities.repository';
import { MainUniversityResponseDto } from './dto/main-university-response.dto';

@Injectable()
export class UniversitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UniversitiesMapper,
    private readonly repository: UniversitiesRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async clearCache(specificKeys?: string[]) {
    try {
      if (specificKeys && specificKeys.length > 0) {
        // Targeted cache invalidation: only delete relevant keys
        await Promise.all(specificKeys.map((key) => this.cacheManager.del(key)));
      }
      // Also clear by pattern for university-related keys
      if (typeof (this.cacheManager as any).reset === 'function') {
        await (this.cacheManager as any).reset();
      } else if (typeof (this.cacheManager as any).clear === 'function') {
        await (this.cacheManager as any).clear();
      } else if (
        typeof (this.cacheManager as any).store?.reset === 'function'
      ) {
        await (this.cacheManager as any).store.reset();
      }
    } catch (e) {
      console.warn('Cache clearing failed', e);
    }
  }

  async create(
    createUniversityDto: CreateUniversityDto,
  ): Promise<UniversityResponseDto> {
    const {
      programs,
      countryCode,
      cityId,
      admissionRequirements,
      agencyService,
      ...universityData
    } = createUniversityDto;

    if (universityData.isMain) {
      await this.validateIsMainLimit('university');
    }

    await this.validateProgramIds(programs.map((p) => p.programId));

    try {
      const createdUniversity = await this.prisma.university.create({
        data: {
          ...universityData,
          country: { connect: { code: countryCode } },
          city: { connect: { id: cityId } },
          universityPrograms: {
            create: programs.map((program) => ({
              program: { connect: { id: program.programId } },
              tuitionFee: program.tuitionFee,
              tuitionFeeType: program.tuitionFeeType,
              tuitionFeeCurrency: program.tuitionFeeCurrency || 'USD',
              studyLevel: program.studyLevel,
              duration: program.duration,
              studyLanguage: program.studyLanguage,
              campuses: program.campusIds
                ? { connect: program.campusIds.map((id) => ({ id })) }
                : undefined,
              intakes: program.intakes
                ? {
                    create: program.intakes.map((intakeId) => ({
                      intake: { connect: { id: intakeId } },
                    })),
                  }
                : undefined,
            })),
          },
          admissionRequirements: admissionRequirements
            ? {
                create: admissionRequirements.map((req) => ({
                  ...req,
                  languageRequirements: req.languageRequirements as any,
                })),
              }
            : undefined,
          agencyService: agencyService
            ? {
                create: {
                  basic: agencyService.basic as any,
                  standard: agencyService.standard as any,
                  premium: agencyService.premium as any,
                },
              }
            : undefined,
        },
        include: {
          country: true,
          city: true,
          universityPrograms: {
            include: {
              program: true,
              intakes: {
                include: {
                  intake: true,
                },
              },
              campuses: true,
            },
          },
          admissionRequirements: true,
          campuses: true,
          agencyService: true,
        },
      });
      await this.clearCache();
      return this.mapper.toResponseDto(createdUniversity as any, 'uz');
    } catch (error) {
      this.handlePrismaError(error, countryCode, cityId);
      throw error;
    }
  }

  async createMany(
    createManyUniversitiesDto: CreateUniversityDto[],
  ): Promise<UniversityResponseDto[]> {
    const createdUniversities = await Promise.all(
      createManyUniversitiesDto.map((dto) => this.create(dto)),
    );
    await this.clearCache();
    return createdUniversities;
  }

  async findAll(
    filterDto: UniversityFilterDto,
    lang: string = 'uz',
  ): Promise<PaginatedUniversityListItemResponseDto> {
    const cacheKey = `universities:all:${JSON.stringify(filterDto)}:${lang}`;
    const cached =
      await this.cacheManager.get<PaginatedUniversityListItemResponseDto>(
        cacheKey,
      );
    if (cached) return cached;

    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'ranking',
        sortDirection = 'asc',
      } = filterDto;

      const where = this.repository.buildUniversityWhereClause(filterDto);
      const orderBy = this.repository.getSortConfig(sortBy, sortDirection);

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [universities, total] = await Promise.all([
        this.prisma.university.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            country: {
              select: {
                code: true,
                nameUz: true,
                nameRu: true,
                nameEn: true,
              },
            },
            city: {
              select: {
                id: true,
                nameUz: true,
                nameRu: true,
                nameEn: true,
              },
            },
            universityPrograms: {
              select: {
                tuitionFee: true,
                tuitionFeeType: true,
                tuitionFeeCurrency: true,
                studyLevel: true,
              },
            },
          },
        }),
        this.prisma.university.count({ where }),
      ]);

      const data = universities.map((uni) =>
        this.mapper.toListItemDto(uni as any, lang),
      );
      const totalPages = Math.ceil(total / Number(limit));

      const result = {
        data,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages,
        },
      };
      await this.cacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error finding universities:', error);
      throw error;
    }
  }

  async findOne(
    id: string,
    lang: string = 'uz',
  ): Promise<UniversityResponseDto> {
    const cacheKey = `universities:one:${id}:${lang}`;
    const cached = await this.cacheManager.get<UniversityResponseDto>(cacheKey);
    if (cached) return cached;

    try {
      const university = await this.prisma.university.findUnique({
        where: { id },
        include: {
          country: true,
          city: true,
          universityPrograms: {
            include: {
              program: true,
              scholarships: true,
              campuses: true,
              intakes: {
                include: {
                  intake: true,
                },
              },
            },
          },
          scholarships: true,
          admissionRequirements: true,
          campuses: true,
          agencyService: true,
        },
      });

      if (!university) {
        throw new EntityNotFoundException('University', id);
      }

      const result = this.mapper.toResponseDto(university as any, lang);
      await this.cacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      console.error(`Error finding university with id ${id}:`, error);
      throw error;
    }
  }

  async update(
    id: string,
    updateUniversityDto: UpdateUniversityDto,
  ): Promise<UniversityResponseDto> {
    const {
      programs,
      countryCode,
      cityId,
      admissionRequirements,
      agencyService,
      ...otherFields
    } = updateUniversityDto;

    const existingUniversity = await this.prisma.university.findUnique({
      where: { id },
      include: { universityPrograms: true },
    });
    if (!existingUniversity) {
      throw new EntityNotFoundException('University', id);
    }

    if (otherFields.isMain && !existingUniversity.isMain) {
      await this.validateIsMainLimit('university');
    }

    if (programs) {
      await this.validateProgramIds(programs.map((p) => p.programId));
    }

    try {
      const updatedUniversity = await this.prisma.$transaction(async (tx) => {
        const dataToUpdate: Prisma.UniversityUpdateInput = { ...otherFields };
        if (countryCode !== undefined) {
          dataToUpdate.country = { connect: { code: countryCode } };
        }
        if (cityId !== undefined) {
          dataToUpdate.city = { connect: { id: cityId } };
        }

        await tx.university.update({
          where: { id },
          data: dataToUpdate,
        });

        if (programs) {
          await this.updateUniversityPrograms(
            tx,
            id,
            programs,
            existingUniversity.universityPrograms,
          );
        }

        if (admissionRequirements) {
          await tx.admissionRequirement.deleteMany({
            where: { universityId: id },
          });
          if (admissionRequirements.length > 0) {
            await tx.admissionRequirement.createMany({
              data: admissionRequirements.map((req) => ({
                ...req,
                universityId: id,
                languageRequirements: req.languageRequirements as any,
              })),
            });
          }
        }
        
        if (agencyService) {
          await tx.agencyService.upsert({
            where: { universityId: id },
            create: {
              ...agencyService,
              universityId: id,
              basic: agencyService.basic as any,
              standard: agencyService.standard as any,
              premium: agencyService.premium as any,
            },
            update: {
              basic: agencyService.basic as any,
              standard: agencyService.standard as any,
              premium: agencyService.premium as any,
            },
          });
        }

        return tx.university.findUnique({
          where: { id },
          include: {
            country: true,
            city: true,
            universityPrograms: {
              include: {
                program: true,
                campuses: true,
                intakes: {
                  include: {
                    intake: true,
                  },
                },
              },
            },
            admissionRequirements: true,
            campuses: true,
            agencyService: true,
          },
        });
      });

      if (!updatedUniversity) {
        throw new Error(
          'Failed to retrieve updated university after transaction.',
        );
      }

      await this.clearCache();
      return this.mapper.toResponseDto(updatedUniversity as any, 'uz');
    } catch (error) {
      this.handlePrismaError(error, countryCode, cityId);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const university = await this.prisma.university.findUnique({
        where: { id },
      });

      if (!university) {
        throw new EntityNotFoundException('University', id);
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.universityProgram.deleteMany({
          where: { universityId: id },
        });

        await tx.university.delete({
          where: { id },
        });
      });
      await this.clearCache();
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new EntityNotFoundException('University', id);
        }
        if (error.code === 'P2003') {
          throw new InvalidDataException(
            'Cannot delete university because it has other related records (e.g., applications).',
            { reason: 'FOREIGN_KEY_CONSTRAINT', errorCode: error.code },
          );
        }
      }
      console.error(`Error deleting university with id ${id}:`, error);
      throw error;
    }
  }

  async removeUniversityProgram(
    universityId: string,
    programId: string,
  ): Promise<void> {
    try {
      const universityProgram = await this.prisma.universityProgram.findFirst({
        where: {
          universityId,
          programId,
        },
      });

      if (!universityProgram) {
        throw new EntityNotFoundException('University Program association');
      }

      await this.prisma.universityProgram.delete({
        where: { id: universityProgram.id },
      });
      await this.clearCache();
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      console.error(`Error removing university-program association:`, error);
      throw new InvalidDataException(
        'Failed to remove university-program association',
        { universityId, programId },
      );
    }
  }

  async findMainUniversities(
    lang: string = 'uz',
  ): Promise<MainUniversityResponseDto[]> {
    const cacheKey = `universities:main:${lang}`;
    const cached =
      await this.cacheManager.get<MainUniversityResponseDto[]>(cacheKey);
    if (cached) return cached;

    try {
      const universities = await this.prisma.university.findMany({
        where: { isMain: true },
        take: 3,
        include: {
          country: true,
          city: true,
          universityPrograms: {
            take: 5,
            include: {
              program: true,
            },
          },
        },
        orderBy: { ranking: 'asc' },
      });

      const result = universities.map((uni) =>
        this.mapper.toMainUniversityDto(uni as any, lang),
      );
      await this.cacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error finding main universities:', error);
      throw error;
    }
  }

  async findUniversitiesByPrograms(
    filterDto: UniversitiesByProgramsFilterDto,
    lang: string = 'uz',
  ) {
    const cacheKey = `universities:byPrograms:${JSON.stringify(filterDto)}:${lang}`;
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'ranking',
        sortDirection = 'asc',
      } = filterDto;

      const where =
        this.repository.buildUniversityProgramWhereClause(filterDto);
      const orderBy = this.repository.getUniversityProgramSortConfig(
        sortBy,
        sortDirection,
      );

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [universityPrograms, total] = await this.prisma.$transaction([
        this.prisma.universityProgram.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            university: {
              include: {
                country: {
                  select: {
                    code: true,
                    nameUz: true,
                    nameRu: true,
                    nameEn: true,
                  },
                },
                city: {
                  select: {
                    id: true,
                    nameUz: true,
                    nameRu: true,
                    nameEn: true,
                    descriptionUz: true,
                    descriptionRu: true,
                    descriptionEn: true,
                  },
                },
              },
            },
            program: {
              select: {
                id: true,
                titleUz: true,
                titleRu: true,
                titleEn: true,
                descriptionUz: true,
                descriptionRu: true,
                descriptionEn: true,
              },
            },
            intakes: {
              include: {
                intake: true,
              },
            },
            scholarships: {
              select: {
                id: true,
                title: true,
                amount: true,
                isAutoApplied: true,
                nationalities: true,
                programLevels: true,
                overview: true,
                howItWorks: true,
                scholarshipValue: true,
                importantNotes: true,
                eligibilityCriteria: true,
                sourceUrl: true,
                universityId: true,
                createdAt: true,
                lastUpdated: true,
              },
            },
            campuses: true,
          },
        }),
        this.prisma.universityProgram.count({ where }),
      ]);

      const data = universityPrograms.map((up) =>
        this.mapper.toUniversityByProgramDto(up as any, lang),
      );
      const totalPages = Math.ceil(total / Number(limit));

      const result = {
        data,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages,
        },
      };
      await this.cacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error finding universities by programs:', error);
      throw error;
    }
  }

  async findProgramsByUniversity(universityId: string, lang: string) {
    if (!universityId) {
      throw new BadRequestException('University ID is required');
    }
    const cacheKey = `universities:programs:${universityId}:${lang}`;
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const foundUniversity = await this.prisma.university.findUnique({
      where: {
        id: universityId,
      },
    });
    if (!foundUniversity) {
      throw new NotFoundException('University not found');
    }
    try {
      const programsByUniversity = await this.prisma.universityProgram.findMany(
        {
          where: {
            universityId,
          },
          include: {
            program: {
              select: {
                id: true,
                titleUz: true,
                titleRu: true,
                titleEn: true,
                descriptionUz: true,
                descriptionRu: true,
                descriptionEn: true,
              },
            },
            university: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                countryCode: true,
              },
            },
            scholarships: {
              select: {
                id: true,
                title: true,
                amount: true,
                isAutoApplied: true,
              },
            },
          },
        },
      );

      const result = programsByUniversity.map((up) =>
        this.mapper.toProgramDetailsDto(up as any, lang),
      );
      await this.cacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      throw new BadRequestException('Error finding programs by university');
    }
  }

  private async updateUniversityPrograms(
    tx: Prisma.TransactionClient,
    universityId: string,
    programs: any[],
    existingPrograms: any[],
  ) {
    const incomingProgramIds = new Set(programs.map((p) => p.programId));
    const programsToDelete = existingPrograms
      .filter((up) => !incomingProgramIds.has(up.programId))
      .map((up) => up.programId);

    if (programsToDelete.length > 0) {
      await tx.universityProgram.deleteMany({
        where: {
          universityId,
          programId: { in: programsToDelete },
        },
      });
    }

    for (const programData of programs) {
      const upsertedProgram = await tx.universityProgram.upsert({
        where: {
          universityId_programId_studyLevel: {
            universityId,
            programId: programData.programId,
            studyLevel: programData.studyLevel,
          },
        },
        create: {
          university: { connect: { id: universityId } },
          program: { connect: { id: programData.programId } },
          tuitionFee: programData.tuitionFee,
          tuitionFeeType: programData.tuitionFeeType,
          tuitionFeeCurrency: programData.tuitionFeeCurrency,
          studyLevel: programData.studyLevel,
          duration: programData.duration,
          studyLanguage: programData.studyLanguage,
          campuses: programData.campusIds
            ? { connect: programData.campusIds.map((id: string) => ({ id })) }
            : undefined,
        },
        update: {
          tuitionFee: programData.tuitionFee,
          tuitionFeeType: programData.tuitionFeeType,
          tuitionFeeCurrency: programData.tuitionFeeCurrency,
          studyLevel: programData.studyLevel,
          duration: programData.duration,
          studyLanguage: programData.studyLanguage,
          campuses: programData.campusIds
            ? { set: programData.campusIds.map((id: string) => ({ id })) }
            : undefined,
        },
      });

      if (programData.intakes) {
        await tx.universityProgramIntake.deleteMany({
          where: { universityProgramId: upsertedProgram.id },
        });

        await tx.universityProgramIntake.createMany({
          data: programData.intakes.map((intakeId) => ({
            universityProgramId: upsertedProgram.id,
            intakeId,
          })),
        });
      }
    }
  }

  private async validateProgramIds(programIds: string[]): Promise<void> {
    if (!programIds || programIds.length === 0) {
      return;
    }
    const existingPrograms = await this.prisma.program.findMany({
      where: { id: { in: programIds } },
      select: { id: true },
    });
    const existingProgramIdsSet = new Set(existingPrograms.map((p) => p.id));
    const invalidIds = programIds.filter(
      (id) => !existingProgramIdsSet.has(id),
    );
    if (invalidIds.length > 0) {
      throw new InvalidDataException(
        `Invalid program IDs provided: ${invalidIds.join(', ')}`,
      );
    }
  }

  private async validateIsMainLimit(
    entityType: 'university' | 'country',
  ): Promise<void> {
    let count: number;
    if (entityType === 'university') {
      count = await this.prisma.university.count({
        where: { isMain: true },
      });
    } else {
      count = await this.prisma.country.count({
        where: { isMain: true },
      });
    }

    if (count >= 3) {
      throw new InvalidDataException(
        `Cannot set as main: maximum of 3 ${entityType === 'university' ? 'universities' : 'countries'} can be marked as main`,
      );
    }
  }

  private handlePrismaError(
    error: any,
    countryCode?: number | string,
    cityId?: string,
  ) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new InvalidDataException(
          `University creation failed due to duplicate data: ${error.meta?.target}`,
        );
      } else if (error.code === 'P2025') {
        throw new InvalidDataException(
          `Invalid country code (${countryCode}) or city ID (${cityId}) provided.`,
        );
      }
    }
    console.error('Error creating/updating university:', error);
  }
}
