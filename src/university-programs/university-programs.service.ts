import { Injectable } from '@nestjs/common';
import { Prisma, UniversityProgram } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../db/prisma.service';
import {
  EntityNotFoundException,
  InvalidDataException,
} from '../common/exceptions/app.exceptions';
import { CreateUniversityProgramDto } from './dto/create-university-program.dto';
import { UpdateUniversityProgramDto } from './dto/update-university-program.dto';
import { UniversityProgramFilterDto } from './dto/university-program-filter.dto';
import { ProgramAdmissionRequirementDto } from './dto/program-admission-requirement.dto';
import { PaginatedUniversityProgramResponseDto } from './dto/paginated-university-program-response.dto';
import {
  ProgramAdmissionRequirementResponseDto,
  UniversityProgramDetailDto,
  UniversityProgramFacetBucketDto,
  UniversityProgramFacetsDto,
} from './dto/university-program-response.dto';
import {
  UNIVERSITY_PROGRAM_DETAIL_INCLUDE,
  UNIVERSITY_PROGRAM_LIST_INCLUDE,
  UniversityProgramsRepository,
} from './university-programs.repository';
import {
  UniversityProgramDetailRow,
  UniversityProgramListRow,
  UniversityProgramsMapper,
} from './university-programs.mapper';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Columns written straight through from the DTO on both create and update. */
const PROGRAM_SCALAR_KEYS = [
  'title',
  'tuitionFee',
  'tuitionFeeType',
  'tuitionFeeCurrency',
  'studyLevel',
  'duration',
  'scholarshipAppliedTutionFee',
  'descriptionEn',
  'descriptionRu',
  'descriptionUz',
  'careerOutcomesEn',
  'careerOutcomesRu',
  'careerOutcomesUz',
  'curriculumEn',
  'curriculumRu',
  'curriculumUz',
  'credits',
  'studyMode',
  'applicationFee',
  'applicationFeeCurrency',
  'isApplicationFeeRefundable',
  'isActive',
  'isFeatured',
] as const;

type UniversityProgramScalarData = Partial<
  Pick<UniversityProgram, (typeof PROGRAM_SCALAR_KEYS)[number]>
> & { additionalExpenses?: Prisma.InputJsonValue };

@Injectable()
export class UniversityProgramsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: UniversityProgramsRepository,
    private readonly mapper: UniversityProgramsMapper,
  ) {}

  // -------------------------------------------------------------------------
  // Public reads
  // -------------------------------------------------------------------------

  async findAll(
    filterDto: UniversityProgramFilterDto,
    lang: string,
  ): Promise<PaginatedUniversityProgramResponseDto> {
    const page = Number(filterDto.page) > 0 ? Number(filterDto.page) : 1;
    const limit = Number(filterDto.limit) > 0 ? Number(filterDto.limit) : 10;

    // Placeholder rows produced by the data migration are inactive and must
    // never surface publicly.
    const where = await this.repository.buildWhereClause(filterDto, {
      onlyActive: true,
    });
    const orderBy = this.repository.getSortConfig(
      filterDto.sortBy,
      filterDto.sortDirection || 'desc',
    );

    const [total, programs] = await Promise.all([
      this.prisma.universityProgram.count({ where }),
      this.prisma.universityProgram.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: UNIVERSITY_PROGRAM_LIST_INCLUDE,
      }),
    ]);

    return {
      data: programs.map((program) =>
        this.mapper.toListItemDto(program as UniversityProgramListRow, lang),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async findOne(
    idOrSlug: string,
    lang: string,
    options: { includeInactive?: boolean } = {},
  ): Promise<UniversityProgramDetailDto> {
    const identifiers: Prisma.UniversityProgramWhereInput[] = [
      { slug: idOrSlug },
    ];
    if (UUID_PATTERN.test(idOrSlug)) identifiers.push({ id: idOrSlug });

    const program = await this.prisma.universityProgram.findFirst({
      where: {
        ...(options.includeInactive ? {} : { isActive: true }),
        OR: identifiers,
      },
      include: UNIVERSITY_PROGRAM_DETAIL_INCLUDE,
    });

    if (!program)
      throw new EntityNotFoundException('UniversityProgram', idOrSlug);

    return this.mapper.toDetailDto(
      program as unknown as UniversityProgramDetailRow,
      lang,
    );
  }

  async getFacets(
    filterDto: UniversityProgramFilterDto,
    lang: string,
  ): Promise<UniversityProgramFacetsDto> {
    const suffix = this.mapper.getLangSuffix(this.mapper.resolveLang(lang));
    const where = await this.repository.buildWhereClause(filterDto, {
      onlyActive: true,
    });

    const [facultyGroups, departmentGroups, studyLevelGroups, total] =
      await Promise.all([
        this.prisma.universityProgram.groupBy({
          by: ['facultyId'],
          where,
          _count: { _all: true },
        }),
        this.prisma.universityProgram.groupBy({
          by: ['departmentId'],
          where,
          _count: { _all: true },
        }),
        this.prisma.universityProgram.groupBy({
          by: ['studyLevel'],
          where,
          _count: { _all: true },
        }),
        this.prisma.universityProgram.count({ where }),
      ]);

    const facultyIds = facultyGroups
      .map((group) => group.facultyId)
      .filter(Boolean);
    const departmentIds = departmentGroups
      .map((group) => group.departmentId)
      .filter(Boolean);

    const [faculties, departments] = await Promise.all([
      facultyIds.length
        ? this.prisma.faculty.findMany({ where: { id: { in: facultyIds } } })
        : Promise.resolve([]),
      departmentIds.length
        ? this.prisma.department.findMany({
            where: { id: { in: departmentIds } },
          })
        : Promise.resolve([]),
    ]);

    const facultyById = new Map(faculties.map((item) => [item.id, item]));
    const departmentById = new Map(departments.map((item) => [item.id, item]));

    const sortByCount = (
      a: UniversityProgramFacetBucketDto,
      b: UniversityProgramFacetBucketDto,
    ) => b.count - a.count;

    return {
      faculties: facultyGroups
        .filter((group) => !!group.facultyId)
        .map((group) => ({
          value: group.facultyId,
          label: this.mapper.getLocalizedField(
            facultyById.get(group.facultyId),
            'name',
            suffix,
          ),
          count: group._count._all,
        }))
        .sort(sortByCount),
      departments: departmentGroups
        .filter((group) => !!group.departmentId)
        .map((group) => ({
          value: group.departmentId,
          label: this.mapper.getLocalizedField(
            departmentById.get(group.departmentId),
            'name',
            suffix,
          ),
          count: group._count._all,
        }))
        .sort(sortByCount),
      studyLevels: studyLevelGroups
        .map((group) => ({
          value: group.studyLevel as string,
          label: group.studyLevel as string,
          count: group._count._all,
        }))
        .sort(sortByCount),
      total,
    };
  }

  // -------------------------------------------------------------------------
  // Admin writes
  // -------------------------------------------------------------------------

  async create(
    dto: CreateUniversityProgramDto,
    lang: string,
  ): Promise<UniversityProgramDetailDto> {
    await this.assertUniversityExists(dto.universityId);
    await this.assertTaxonomy(dto.facultyId, dto.departmentId);
    await this.assertCampusesBelongToUniversity(
      dto.campusIds,
      dto.universityId,
    );
    await this.assertIntakesExist(dto.intakeIds);

    // Mirrors the SQL in 20260726001000_backfill_program_hierarchy: the slug is
    // the kebab-cased title plus an 8-char suffix taken from the row id, which
    // keeps it readable and collision-free even for duplicate titles.
    const id = randomUUID();
    const slug = await this.resolveUniqueSlug(
      dto.slug ? this.toKebabCase(dto.slug) : this.buildSlug(dto.title, id),
    );

    const created = await this.prisma.universityProgram.create({
      data: {
        id,
        slug,
        ...this.toScalarData(dto),
        // Restated so TypeScript sees the required create columns.
        title: dto.title,
        tuitionFee: dto.tuitionFee,
        studyLevel: dto.studyLevel,
        university: { connect: { id: dto.universityId } },
        ...(dto.facultyId && { faculty: { connect: { id: dto.facultyId } } }),
        ...(dto.departmentId && {
          department: { connect: { id: dto.departmentId } },
        }),
        ...(dto.studyLanguageId && {
          studyLanguage: { connect: { id: dto.studyLanguageId } },
        }),
        ...(dto.campusIds?.length && {
          campuses: {
            connect: dto.campusIds.map((campusId) => ({ id: campusId })),
          },
        }),
        ...(dto.intakeIds?.length && {
          intakes: {
            create: dto.intakeIds.map((intakeId) => ({ intakeId })),
          },
        }),
        ...(dto.admissionRequirement && {
          admissionRequirement: {
            create: this.toAdmissionRequirementCreateInput(
              dto.admissionRequirement,
            ),
          },
        }),
      },
      include: UNIVERSITY_PROGRAM_DETAIL_INCLUDE,
    });

    return this.mapper.toDetailDto(
      created as unknown as UniversityProgramDetailRow,
      lang,
    );
  }

  async update(
    id: string,
    dto: UpdateUniversityProgramDto,
    lang: string,
  ): Promise<UniversityProgramDetailDto> {
    const existing = await this.prisma.universityProgram.findUnique({
      where: { id },
      select: { id: true, universityId: true, facultyId: true, slug: true },
    });
    if (!existing) throw new EntityNotFoundException('UniversityProgram', id);

    if (dto.universityId) await this.assertUniversityExists(dto.universityId);

    // The department must belong to the *effective* faculty, which may still
    // be the stored one when only departmentId is being changed.
    const effectiveFacultyId =
      dto.facultyId !== undefined ? dto.facultyId : existing.facultyId;
    if (dto.facultyId !== undefined || dto.departmentId !== undefined) {
      await this.assertTaxonomy(effectiveFacultyId, dto.departmentId);
    }

    const targetUniversityId = dto.universityId || existing.universityId;
    await this.assertCampusesBelongToUniversity(
      dto.campusIds,
      targetUniversityId,
    );
    await this.assertIntakesExist(dto.intakeIds);

    // Renaming a program never moves its public URL; only an explicit slug does.
    const slug =
      dto.slug !== undefined
        ? await this.resolveUniqueSlug(this.toKebabCase(dto.slug), id)
        : undefined;

    await this.prisma.$transaction(async (tx) => {
      await tx.universityProgram.update({
        where: { id },
        data: {
          ...this.toScalarData(dto),
          ...(slug !== undefined && { slug }),
          ...(dto.universityId && {
            university: { connect: { id: dto.universityId } },
          }),
          ...(dto.facultyId !== undefined && {
            faculty: dto.facultyId
              ? { connect: { id: dto.facultyId } }
              : { disconnect: true },
          }),
          ...(dto.departmentId !== undefined && {
            department: dto.departmentId
              ? { connect: { id: dto.departmentId } }
              : { disconnect: true },
          }),
          ...(dto.studyLanguageId !== undefined && {
            studyLanguage: dto.studyLanguageId
              ? { connect: { id: dto.studyLanguageId } }
              : { disconnect: true },
          }),
          // Wholesale replacement when present, untouched when absent.
          ...(dto.campusIds !== undefined && {
            campuses: {
              set: (dto.campusIds || []).map((campusId) => ({ id: campusId })),
            },
          }),
        },
      });

      if (dto.intakeIds !== undefined) {
        await tx.universityProgramIntake.deleteMany({
          where: { universityProgramId: id },
        });
        if (dto.intakeIds?.length) {
          await tx.universityProgramIntake.createMany({
            data: dto.intakeIds.map((intakeId) => ({
              universityProgramId: id,
              intakeId,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (dto.admissionRequirement !== undefined) {
        await this.replaceAdmissionRequirement(
          tx,
          id,
          dto.admissionRequirement,
        );
      }
    });

    const updated = await this.prisma.universityProgram.findUnique({
      where: { id },
      include: UNIVERSITY_PROGRAM_DETAIL_INCLUDE,
    });

    return this.mapper.toDetailDto(
      updated as unknown as UniversityProgramDetailRow,
      lang,
    );
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.universityProgram.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new EntityNotFoundException('UniversityProgram', id);

    const [applications, partnerApplications] = await Promise.all([
      this.prisma.application.count({ where: { preferredProgram: id } }),
      this.prisma.partnerApplication.count({ where: { programId: id } }),
    ]);

    const count = applications + partnerApplications;
    if (count > 0) {
      throw new InvalidDataException(
        'This program cannot be deleted because applications reference it. Deactivate it instead (set isActive to false) to hide it from the catalog.',
        { reason: 'RELATED_APPLICATIONS_EXIST', count },
      );
    }

    await this.prisma.universityProgram.delete({ where: { id } });
  }

  /**
   * Upserts only the structured requirements block so the admin requirements
   * tab can save independently of the rest of the program form.
   */
  async upsertAdmissionRequirement(
    id: string,
    dto: ProgramAdmissionRequirementDto,
    lang: string,
  ): Promise<ProgramAdmissionRequirementResponseDto> {
    const existing = await this.prisma.universityProgram.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new EntityNotFoundException('UniversityProgram', id);

    await this.prisma.$transaction(async (tx) => {
      await this.replaceAdmissionRequirement(tx, id, dto);
    });

    const requirement =
      await this.prisma.programAdmissionRequirement.findUnique({
        where: { universityProgramId: id },
        include: {
          languageTests: true,
          standardizedTests: true,
          documents: { orderBy: { sortOrder: 'asc' } },
        },
      });

    return this.mapper.toAdmissionRequirementDto(
      requirement,
      this.mapper.getLangSuffix(this.mapper.resolveLang(lang)),
    );
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  /** Scalar (non-relational) columns shared by create and update. */
  private toScalarData(
    dto: CreateUniversityProgramDto | UpdateUniversityProgramDto,
  ): UniversityProgramScalarData {
    const data: Record<string, unknown> = {};

    for (const key of PROGRAM_SCALAR_KEYS) {
      if (dto[key] !== undefined) data[key] = dto[key];
    }

    if (dto.additionalExpenses !== undefined) {
      data.additionalExpenses = (dto.additionalExpenses ??
        []) as unknown as Prisma.InputJsonValue;
    }

    return data as UniversityProgramScalarData;
  }

  private toAdmissionRequirementCreateInput(
    dto: ProgramAdmissionRequirementDto,
  ): Prisma.ProgramAdmissionRequirementCreateWithoutUniversityProgramInput {
    return {
      minEducationLevel: dto.minEducationLevel,
      minGpa: dto.minGpa,
      gpaScale: dto.gpaScale,
      requiredSubjects: dto.requiredSubjects || [],
      minWorkExperienceYears: dto.minWorkExperienceYears,
      minAge: dto.minAge,
      maxAge: dto.maxAge,
      requiresInterview: dto.requiresInterview,
      requiresPortfolio: dto.requiresPortfolio,
      englishRequirementWaivable: dto.englishRequirementWaivable,
      englishWaiverNoteEn: dto.englishWaiverNoteEn,
      englishWaiverNoteRu: dto.englishWaiverNoteRu,
      englishWaiverNoteUz: dto.englishWaiverNoteUz,
      additionalNotesEn: dto.additionalNotesEn,
      additionalNotesRu: dto.additionalNotesRu,
      additionalNotesUz: dto.additionalNotesUz,
      ...(dto.languageTests?.length && {
        languageTests: {
          create: dto.languageTests.map((test) => ({
            test: test.test,
            minTotal: test.minTotal,
            minListening: test.minListening,
            minReading: test.minReading,
            minWriting: test.minWriting,
            minSpeaking: test.minSpeaking,
          })),
        },
      }),
      ...(dto.standardizedTests?.length && {
        standardizedTests: {
          create: dto.standardizedTests.map((test) => ({
            test: test.test,
            minScore: test.minScore,
            status: test.status,
          })),
        },
      }),
      ...(dto.documents?.length && {
        documents: {
          create: dto.documents.map((doc) => ({
            kind: doc.kind,
            status: doc.status,
            quantity: doc.quantity,
            labelEn: doc.labelEn,
            labelRu: doc.labelRu,
            labelUz: doc.labelUz,
            notesEn: doc.notesEn,
            notesRu: doc.notesRu,
            notesUz: doc.notesUz,
            sortOrder: doc.sortOrder,
          })),
        },
      }),
    };
  }

  /**
   * Wholesale replacement: dropping the row cascades to the child tables, so
   * the saved block always matches the payload exactly. Passing `null`
   * removes the requirement entirely.
   */
  private async replaceAdmissionRequirement(
    tx: Prisma.TransactionClient,
    universityProgramId: string,
    dto: ProgramAdmissionRequirementDto | null,
  ): Promise<void> {
    await tx.programAdmissionRequirement.deleteMany({
      where: { universityProgramId },
    });
    if (!dto) return;

    await tx.programAdmissionRequirement.create({
      data: {
        universityProgram: { connect: { id: universityProgramId } },
        ...this.toAdmissionRequirementCreateInput(dto),
      },
    });
  }

  private async assertUniversityExists(universityId: string): Promise<void> {
    const university = await this.prisma.university.findUnique({
      where: { id: universityId },
      select: { id: true },
    });
    if (!university)
      throw new EntityNotFoundException('University', universityId);
  }

  /** A department may only be attached to its own faculty. */
  private async assertTaxonomy(
    facultyId?: string,
    departmentId?: string,
  ): Promise<void> {
    if (facultyId) {
      const faculty = await this.prisma.faculty.findUnique({
        where: { id: facultyId },
        select: { id: true },
      });
      if (!faculty) throw new EntityNotFoundException('Faculty', facultyId);
    }

    if (!departmentId) return;

    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, facultyId: true },
    });
    if (!department) {
      throw new EntityNotFoundException('Department', departmentId);
    }

    if (!facultyId) {
      throw new InvalidDataException(
        'facultyId is required when departmentId is provided',
        { reason: 'FACULTY_REQUIRED', departmentId },
      );
    }

    if (department.facultyId !== facultyId) {
      throw new InvalidDataException(
        'The selected department does not belong to the selected faculty',
        {
          reason: 'DEPARTMENT_FACULTY_MISMATCH',
          departmentId,
          facultyId,
          expectedFacultyId: department.facultyId,
        },
      );
    }
  }

  private async assertCampusesBelongToUniversity(
    campusIds: string[] | undefined,
    universityId: string,
  ): Promise<void> {
    if (!campusIds?.length) return;

    const campuses = await this.prisma.campus.findMany({
      where: { id: { in: campusIds }, universityId },
      select: { id: true },
    });

    if (campuses.length !== new Set(campusIds).size) {
      const found = new Set(campuses.map((campus) => campus.id));
      throw new InvalidDataException(
        'One or more campuses do not exist or belong to a different university',
        {
          reason: 'INVALID_CAMPUS_IDS',
          invalidCampusIds: campusIds.filter(
            (campusId) => !found.has(campusId),
          ),
        },
      );
    }
  }

  private async assertIntakesExist(
    intakeIds: string[] | undefined,
  ): Promise<void> {
    if (!intakeIds?.length) return;

    const intakes = await this.prisma.intake.findMany({
      where: { id: { in: intakeIds } },
      select: { id: true },
    });

    if (intakes.length !== new Set(intakeIds).size) {
      const found = new Set(intakes.map((intake) => intake.id));
      throw new InvalidDataException('One or more intakes do not exist', {
        reason: 'INVALID_INTAKE_IDS',
        invalidIntakeIds: intakeIds.filter((intakeId) => !found.has(intakeId)),
      });
    }
  }

  private toKebabCase(value: string): string {
    return (
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'program'
    );
  }

  private buildSlug(title: string, id: string): string {
    return `${this.toKebabCase(title)}-${id.slice(0, 8)}`;
  }

  /** Guards against the (rare) case of an explicit slug colliding. */
  private async resolveUniqueSlug(
    candidate: string,
    ignoreId?: string,
  ): Promise<string> {
    let slug = candidate;
    let attempt = 1;

    for (;;) {
      const conflict = await this.prisma.universityProgram.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!conflict || conflict.id === ignoreId) return slug;
      slug = `${candidate}-${++attempt}`;
    }
  }
}
