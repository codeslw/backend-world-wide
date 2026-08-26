import {
  BadRequestException,
  Injectable,
  Logger,
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
import { IntakesService } from '../intakes/intakes.service';
import { ProgramIntakeInputDto } from './dto/program-intake-input.dto';
import { UniversityProgramDto } from './dto/university-program.dto';
import { buildProgramSlug } from '../common/utils/slug.util';
import { randomUUID } from 'crypto';

/**
 * Writing a university rewrites all of its programs and their links, so the
 * transaction's cost grows with the payload. These bounds leave room for a
 * large catalogue without letting a runaway request hold a connection forever.
 */
const UNIVERSITY_TX_TIMEOUT_MS = 30_000;
const UNIVERSITY_TX_MAX_WAIT_MS = 10_000;

@Injectable()
export class UniversitiesService {
  private readonly logger = new Logger(UniversitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UniversitiesMapper,
    private readonly repository: UniversitiesRepository,
    private readonly intakesService: IntakesService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Turn a program's `intakes` payload into concrete intake ids. Each item is
   * either an existing intake id ({ id }) or an inline config
   * ({ season, startMonth?, year, deadline? }) that we find-or-create so the
   * global intake table stays deduplicated. Duplicate ids are removed.
   */
  private async resolveIntakeIds(
    intakes: ProgramIntakeInputDto[] | undefined,
    tx?: Prisma.TransactionClient,
  ): Promise<string[]> {
    if (!intakes || intakes.length === 0) return [];
    const ids: string[] = [];
    for (const input of intakes) {
      if (input.id) {
        ids.push(input.id);
        continue;
      }
      if (!input.season || input.year === undefined) {
        throw new InvalidDataException(
          'Each inline intake requires at least a season and a year.',
        );
      }
      const row = await this.intakesService.findOrCreate(
        {
          season: input.season,
          startMonth: input.startMonth,
          year: input.year,
          deadline: input.deadline ? new Date(input.deadline) : undefined,
        },
        tx,
      );
      ids.push(row.id);
    }
    // De-dupe while preserving order.
    return Array.from(new Set(ids));
  }

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
      this.logger.warn(`Cache clearing failed: ${e instanceof Error ? e.message : e}`);
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
      agencyServiceId,
      ...universityData
    } = createUniversityDto;

    if (universityData.isMain) {
      await this.validateIsMainLimit('university');
    }

    await this.validateProgramTaxonomy(programs);

    // Resolve each program's inline/existing intakes to concrete intake ids
    // (find-or-create) before the university create.
    const programIntakeIds = await Promise.all(
      programs.map((program) => this.resolveIntakeIds(program.intakes)),
    );

    try {
      const createdUniversity = await this.prisma.university.create({
        data: {
          ...universityData,
          additionalExpenses:
            (universityData.additionalExpenses as unknown as Prisma.InputJsonValue) ??
            undefined,
          country: { connect: { code: countryCode } },
          city: { connect: { id: cityId } },
          agencyService: agencyServiceId
            ? { connect: { id: agencyServiceId } }
            : undefined,
          universityPrograms: {
            create: programs.map((program, i) => {
              const id = randomUUID();
              return {
                id,
                slug: buildProgramSlug(program.title, id),
                ...this.buildProgramScalars(program),
                faculty: program.facultyId
                  ? { connect: { id: program.facultyId } }
                  : undefined,
                department: program.departmentId
                  ? { connect: { id: program.departmentId } }
                  : undefined,
                studyLanguage: program.studyLanguageId
                  ? { connect: { id: program.studyLanguageId } }
                  : undefined,
                campuses: program.campusIds
                  ? { connect: program.campusIds.map((cid) => ({ id: cid })) }
                  : undefined,
                intakes: programIntakeIds[i].length
                  ? {
                      create: programIntakeIds[i].map((intakeId) => ({
                        intake: { connect: { id: intakeId } },
                      })),
                    }
                  : undefined,
              };
            }),
          },
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
              faculty: true,
              department: true,
              studyLanguage: true,
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

      const where = this.repository.buildUniversityWhereClause(filterDto, {
        programTitles: await this.resolveProgramTitles(filterDto.programs),
      });
      // Recommended-first ordering only when listing within a single country
      // (e.g. the country page), not in global search/listing.
      const prioritizeRecommended = filterDto.countryCode !== undefined;
      const orderBy = this.repository.getSortConfig(
        sortBy,
        sortDirection,
        prioritizeRecommended,
      );

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
                photoUrl: true,
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
              where: { isActive: true },
              select: {
                id: true,
                title: true,
                slug: true,
                facultyId: true,
                departmentId: true,
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
      this.logger.error(
        `Failed to list universities: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
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
              faculty: true,
              department: true,
              studyLanguage: true,
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
      this.logger.error(
        `Failed to find university ${id}: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
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
      agencyServiceId,
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
      await this.validateProgramTaxonomy(programs);
    }

    // Intakes are a globally deduplicated lookup table, so finding-or-creating
    // them is idempotent and independent of this university. Doing it here
    // instead of inside the transaction keeps a sequential per-intake round
    // trip (which scales with programs x intakes) out of the 
    // interactive-transaction budget.
    const programIntakeIds = programs
      ? await Promise.all(
          programs.map((program) => this.resolveIntakeIds(program.intakes)),
        )
      : [];

    try {
      const updatedUniversity = await this.prisma.$transaction(
        async (tx) => {
          const dataToUpdate: Prisma.UniversityUpdateInput = {
            ...otherFields,
            additionalExpenses:
              (otherFields.additionalExpenses as unknown as Prisma.InputJsonValue) ??
              undefined,
          };
          if (countryCode !== undefined) {
            dataToUpdate.country = { connect: { code: countryCode } };
          }
          if (cityId !== undefined) {
            dataToUpdate.city = { connect: { id: cityId } };
          }
          if (agencyServiceId !== undefined) {
            dataToUpdate.agencyService = agencyServiceId
              ? { connect: { id: agencyServiceId } }
              : { disconnect: true };
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
              programIntakeIds,
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

          return tx.university.findUnique({
            where: { id },
            include: {
              country: true,
              city: true,
              universityPrograms: {
                include: {
                  faculty: true,
                  department: true,
                  studyLanguage: true,
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
        },
        // A university edit rewrites every program row plus its intake and
        // campus links, so the work scales with the size of the payload rather
        // than being constant. Prisma's 5s default is too tight for a
        // catalogue-sized university on a remote database.
        {
          maxWait: UNIVERSITY_TX_MAX_WAIT_MS,
          timeout: UNIVERSITY_TX_TIMEOUT_MS,
        },
      );

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
      this.logger.error(
        `Failed to delete university ${id}: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
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
          id: programId,
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
      this.logger.error(
        `Failed to remove university-program association (uni: ${universityId}, prog: ${programId}): ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InvalidDataException(
        'Failed to remove university-program association',
        { universityId, programId },
      );
    }
  }

  async findMainUniversities(
    lang: string = 'uz',
  ): Promise<MainUniversityResponseDto[]> {
    const cacheKey = `universities:main:v2:${lang}`;
    const cached =
      await this.cacheManager.get<MainUniversityResponseDto[]>(cacheKey);
    if (cached) return cached;

    try {
      const universities = await this.prisma.university.findMany({
        where: { isMain: true },
        take: 3,
        include: {
          country: {
            select: {
              code: true,
              nameUz: true,
              nameRu: true,
              nameEn: true,
              photoUrl: true,
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
            include: {
              faculty: true,
              department: true,
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

      const result = universities.map((uni) =>
        this.mapper.toMainUniversityDto(uni as any, lang),
      );
      await this.cacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to list main universities: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
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
        this.repository.buildUniversityProgramWhereClause(filterDto, {
          programTitles: await this.resolveProgramTitles(filterDto.programs),
        });
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
                    photoUrl: true,
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
            faculty: true,
            department: true,
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
                // Only fetch minimal scholarship info for list view
                // Large text fields like overview and eligibilityCriteria are omitted
                universityId: true,
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
      this.logger.error(
        `Failed to list universities by programs: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
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
            faculty: true,
            department: true,
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

  async findAllUniversityPrograms(lang: string = 'uz') {
    const cacheKey = `universities:allPrograms:${lang}`;
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    // Programs are unique per university, so a global "every program" list is
    // deduplicated by title: it only feeds filter dropdowns, where two
    // universities offering "Computer Science" should appear as one option.
    const universityPrograms = await this.prisma.universityProgram.findMany({
      where: { isActive: true },
      distinct: ['title'],
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    });

    const result = universityPrograms.map((up) => ({
      id: up.id,
      title: up.title,
    }));

    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  private async updateUniversityPrograms(
    tx: Prisma.TransactionClient,
    universityId: string,
    programs: any[],
    existingPrograms: any[],
    programIntakeIds: string[][],
  ) {
    // A university program owns its identity now, so the diff key is its own
    // id. Rows carrying an id are updated in place (which preserves their
    // public slug and any applications pointing at them); rows without one are
    // new; existing rows missing from the payload are removed.
    const incomingIds = new Set(
      programs.map((p) => p.id).filter((id): id is string => Boolean(id)),
    );
    const programsToDelete = existingPrograms
      .filter((up) => !incomingIds.has(up.id))
      .map((up) => up.id);

    if (programsToDelete.length > 0) {
      // Programs that students have already applied to must not disappear from
      // under those applications; hide them instead.
      const referenced = await tx.universityProgram.findMany({
        where: {
          id: { in: programsToDelete },
          OR: [
            { applications: { some: {} } },
            { partnerApplications: { some: {} } },
          ],
        },
        select: { id: true },
      });
      const referencedIds = new Set(referenced.map((p) => p.id));

      const deletableIds = programsToDelete.filter(
        (id) => !referencedIds.has(id),
      );
      if (deletableIds.length > 0) {
        await tx.universityProgram.deleteMany({
          where: { universityId, id: { in: deletableIds } },
        });
      }
      if (referencedIds.size > 0) {
        await tx.universityProgram.updateMany({
          where: { universityId, id: { in: Array.from(referencedIds) } },
          data: { isActive: false },
        });
      }
    }

    // Intake links are rewritten set-wide after the loop rather than per
    // program, so a payload of N programs costs two statements here instead of
    // 2N sequential round trips.
    const intakeLinkTargets: string[] = [];
    const intakeLinkRows: { universityProgramId: string; intakeId: string }[] =
      [];

    for (const [index, programData] of programs.entries()) {
      const id = programData.id ?? randomUUID();
      const scalars = this.buildProgramScalars(programData);
      await tx.universityProgram.upsert({
        where: { id },
        create: {
          id,
          slug: buildProgramSlug(programData.title, id),
          university: { connect: { id: universityId } },
          ...scalars,
          faculty: programData.facultyId
            ? { connect: { id: programData.facultyId } }
            : undefined,
          department: programData.departmentId
            ? { connect: { id: programData.departmentId } }
            : undefined,
          studyLanguage: programData.studyLanguageId
            ? { connect: { id: programData.studyLanguageId } }
            : undefined,
          campuses: programData.campusIds
            ? { connect: programData.campusIds.map((cid: string) => ({ id: cid })) }
            : undefined,
        },
        update: {
          ...scalars,
          // The slug is a public URL, so it deliberately survives a rename.
          faculty: programData.facultyId
            ? { connect: { id: programData.facultyId } }
            : { disconnect: true },
          department: programData.departmentId
            ? { connect: { id: programData.departmentId } }
            : { disconnect: true },
          studyLanguage: programData.studyLanguageId
            ? { connect: { id: programData.studyLanguageId } }
            : { disconnect: true },
          campuses: programData.campusIds
            ? { set: programData.campusIds.map((cid: string) => ({ id: cid })) }
            : undefined,
        },
      });

      // Only programs that actually carried an `intakes` field have their
      // links rewritten; omitting the field leaves the existing ones alone.
      if (programData.intakes) {
        intakeLinkTargets.push(id);
        for (const intakeId of programIntakeIds[index] ?? []) {
          intakeLinkRows.push({ universityProgramId: id, intakeId });
        }
      }
    }

    if (intakeLinkTargets.length > 0) {
      await tx.universityProgramIntake.deleteMany({
        where: { universityProgramId: { in: intakeLinkTargets } },
      });
      if (intakeLinkRows.length > 0) {
        await tx.universityProgramIntake.createMany({
          data: intakeLinkRows,
          skipDuplicates: true,
        });
      }
    }
  }

  /**
   * The program filter dropdown is fed by a title-deduplicated list, so the id
   * the client sends back stands for a program *name*. Resolve those ids to
   * their titles so the filter matches that program at every university.
   */
  private async resolveProgramTitles(
    programIds: string[] | undefined,
  ): Promise<string[]> {
    const ids = Array.isArray(programIds)
      ? programIds
      : programIds
        ? `${programIds}`.split(',').filter(Boolean)
        : [];
    if (ids.length === 0) return [];

    const rows = await this.prisma.universityProgram.findMany({
      where: { id: { in: ids } },
      select: { title: true },
    });
    return Array.from(new Set(rows.map((r) => r.title)));
  }

  /**
   * Everything a university program stores on its own row, shared by the
   * nested create and the update upsert so the two can never drift.
   */
  private buildProgramScalars(program: UniversityProgramDto) {
    return {
      title: program.title,
      tuitionFee: program.tuitionFee,
      tuitionFeeType: program.tuitionFeeType,
      tuitionFeeCurrency: program.tuitionFeeCurrency || 'USD',
      studyLevel: program.studyLevel,
      duration: program.duration,
      scholarshipAppliedTutionFee: program.scholarshipAppliedTutionFee,
      descriptionEn: program.descriptionEn,
      descriptionRu: program.descriptionRu,
      descriptionUz: program.descriptionUz,
      credits: program.credits,
      studyMode: program.studyMode,
      applicationFee: program.applicationFee,
      applicationFeeCurrency: program.applicationFeeCurrency,
      isApplicationFeeRefundable: program.isApplicationFeeRefundable,
      additionalExpenses:
        (program.additionalExpenses as unknown as Prisma.InputJsonValue) ??
        undefined,
      isActive: program.isActive,
      isFeatured: program.isFeatured,
    };
  }

  /**
   * Checks that every faculty/department referenced by the payload exists and
   * that each department really belongs to the faculty it was paired with —
   * otherwise the taxonomy silently rots and the filters stop agreeing with
   * the program pages.
   */
  private async validateProgramTaxonomy(
    programs: UniversityProgramDto[],
  ): Promise<void> {
    if (!programs || programs.length === 0) return;

    const facultyIds = Array.from(
      new Set(programs.map((p) => p.facultyId).filter(Boolean)),
    ) as string[];
    const departmentIds = Array.from(
      new Set(programs.map((p) => p.departmentId).filter(Boolean)),
    ) as string[];

    if (facultyIds.length > 0) {
      const found = await this.prisma.faculty.findMany({
        where: { id: { in: facultyIds } },
        select: { id: true },
      });
      const foundIds = new Set(found.map((f) => f.id));
      const invalid = facultyIds.filter((id) => !foundIds.has(id));
      if (invalid.length > 0) {
        throw new InvalidDataException(
          `Invalid faculty IDs provided: ${invalid.join(', ')}`,
        );
      }
    }

    if (departmentIds.length === 0) return;

    const departments = await this.prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true, facultyId: true },
    });
    const departmentsById = new Map(departments.map((d) => [d.id, d]));
    const invalid = departmentIds.filter((id) => !departmentsById.has(id));
    if (invalid.length > 0) {
      throw new InvalidDataException(
        `Invalid department IDs provided: ${invalid.join(', ')}`,
      );
    }

    for (const program of programs) {
      if (!program.departmentId) continue;
      const department = departmentsById.get(program.departmentId);
      if (program.facultyId && department.facultyId !== program.facultyId) {
        throw new InvalidDataException(
          `Department ${program.departmentId} does not belong to faculty ${program.facultyId}.`,
          { reason: 'DEPARTMENT_FACULTY_MISMATCH' },
        );
      }
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
    this.logger.error(
      `Unhandled Prisma error creating/updating university: ${error instanceof Error ? error.message : error}`,
      error instanceof Error ? error.stack : undefined,
    );
  }
}
