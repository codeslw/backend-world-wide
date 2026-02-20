import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  ) {}

  async create(
    createUniversityDto: CreateUniversityDto,
  ): Promise<UniversityResponseDto> {
    const {
      programs,
      countryCode,
      cityId,
      requirements,
      admissionRequirements,
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
              tuitionFeeCurrency: program.tuitionFeeCurrency || 'USD',
              studyLevel: program.studyLevel,
              duration: program.duration,
              logo: program.logo,
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
          requirements: requirements
            ? {
                create: {
                  ...requirements,
                  otherRequirements: requirements.otherRequirements || [],
                },
              }
            : undefined,
          admissionRequirements: admissionRequirements
            ? {
                create: admissionRequirements.map((req) => ({
                  ...req,
                  languageRequirements: req.languageRequirements as any,
                })),
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
          requirements: true,
          admissionRequirements: true,
        },
      });
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
    return createdUniversities;
  }

  async findAll(
    filterDto: UniversityFilterDto,
    lang: string = 'uz',
  ): Promise<PaginatedUniversityListItemResponseDto> {
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
            country: true,
            city: true,
            universityPrograms: {
              select: {
                tuitionFee: true,
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

      return {
        data,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error finding universities:', error);
      throw error;
    }
  }

  async findOne(
    id: string,
    lang: string = 'uz',
  ): Promise<UniversityResponseDto> {
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
          requirements: true,
          scholarships: true,
          admissionRequirements: true,
        },
      });

      if (!university) {
        throw new EntityNotFoundException('University', id);
      }

      return this.mapper.toResponseDto(university as any, lang);
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
      requirements,
      admissionRequirements,
      ...otherFields
    } = updateUniversityDto;

    const existingUniversity = await this.prisma.university.findUnique({
      where: { id },
      include: { universityPrograms: true, requirements: true },
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

        if (requirements) {
          await this.updateUniversityRequirements(tx, id, requirements);
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
            requirements: true,
            admissionRequirements: true,
          },
        });
      });

      if (!updatedUniversity) {
        throw new Error(
          'Failed to retrieve updated university after transaction.',
        );
      }

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
    try {
      const universities = await this.prisma.university.findMany({
        where: { isMain: true },
        take: 3,
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
            },
          },
        },
        orderBy: { ranking: 'asc' },
      });

      return universities.map((uni) =>
        this.mapper.toMainUniversityDto(uni as any, lang),
      );
    } catch (error) {
      console.error('Error finding main universities:', error);
      throw error;
    }
  }

  async findUniversitiesByPrograms(
    filterDto: UniversitiesByProgramsFilterDto,
    lang: string = 'uz',
  ) {
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
                country: true,
                city: true,
              },
            },
            program: true,
            intakes: {
              include: {
                intake: true,
              },
            },
          },
        }),
        this.prisma.universityProgram.count({ where }),
      ]);

      if (universityPrograms.length > 0) {
        console.log(
          'First UP intakes:',
          JSON.stringify(universityPrograms[0].intakes, null, 2),
        );
      }

      const data = universityPrograms.map((up) =>
        this.mapper.toUniversityByProgramDto(up as any, lang),
      );
      const totalPages = Math.ceil(total / Number(limit));

      return {
        data,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error finding universities by programs:', error);
      throw error;
    }
  }

  async findProgramsByUniversity(universityId: string, lang: string) {
    if (!universityId) {
      throw new BadRequestException('University ID is required');
    }
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
            program: true,
            university: true,
            scholarships: true,
          },
        },
      );

      return programsByUniversity.map((up) =>
        this.mapper.toProgramDetailsDto(up as any, lang),
      );
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
          tuitionFeeCurrency: programData.tuitionFeeCurrency,
          studyLevel: programData.studyLevel,
          duration: programData.duration,
          logo: programData.logo,
          studyLanguage: programData.studyLanguage,
          campuses: programData.campusIds
            ? { connect: programData.campusIds.map((id: string) => ({ id })) }
            : undefined,
        },
        update: {
          tuitionFee: programData.tuitionFee,
          tuitionFeeCurrency: programData.tuitionFeeCurrency,
          studyLevel: programData.studyLevel,
          duration: programData.duration,
          logo: programData.logo,
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

  private async updateUniversityRequirements(
    tx: Prisma.TransactionClient,
    universityId: string,
    requirements: any,
  ) {
    const {
      minIeltsScore,
      minToeflScore,
      minDuolingoScore,
      requiredDegree,
      minGpa,
      minGmatScore,
      minCatScore,
      requiredRecommendationLetters,
      otherRequirements,
    } = requirements;

    const requirementsData = {
      minIeltsScore,
      minToeflScore,
      minDuolingoScore,
      requiredDegree,
      minGpa,
      minGmatScore,
      minCatScore,
      requiredRecommendationLetters,
      otherRequirements: otherRequirements || [],
    };

    await tx.universityRequirements.upsert({
      where: { universityId },
      create: { ...requirementsData, universityId },
      update: requirementsData,
    });
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
