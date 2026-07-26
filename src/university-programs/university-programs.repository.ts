import { Injectable } from '@nestjs/common';
import { LanguageTestType, Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { UniversityProgramFilterDto } from './dto/university-program-filter.dto';

/** Relations loaded for catalog list rows. */
export const UNIVERSITY_PROGRAM_LIST_INCLUDE = {
  university: {
    select: {
      id: true,
      name: true,
      logoUrl: true,
      photoUrl: true,
      ranking: true,
      city: true,
      country: true,
    },
  },
  faculty: true,
  department: true,
  studyLanguage: true,
  intakes: { include: { intake: true } },
  // Existence probe for the `hasScholarship` flag: cheaper than loading them.
  scholarships: { where: { isVisible: true }, select: { id: true }, take: 1 },
} satisfies Prisma.UniversityProgramInclude;

/** Relations loaded for the public program detail page. */
export const UNIVERSITY_PROGRAM_DETAIL_INCLUDE = {
  university: { include: { city: true, country: true } },
  faculty: true,
  department: true,
  studyLanguage: true,
  intakes: { include: { intake: true } },
  campuses: true,
  scholarships: { where: { isVisible: true } },
  admissionRequirement: {
    include: {
      languageTests: true,
      standardizedTests: true,
      documents: { orderBy: { sortOrder: 'asc' } },
    },
  },
} satisfies Prisma.UniversityProgramInclude;

@Injectable()
export class UniversityProgramsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Builds the where clause shared by the catalog list and the facet
   * aggregation. Async because the normalised-GPA predicate compares two
   * columns (minGpa / gpaScale), which Prisma cannot express directly: we
   * resolve the (very small) set of distinct gpaScale values first and expand
   * the predicate into one branch per scale.
   */
  async buildWhereClause(
    filterDto: UniversityProgramFilterDto,
    options: { onlyActive?: boolean } = {},
  ): Promise<Prisma.UniversityProgramWhereInput> {
    const {
      search,
      facultyId,
      departmentId,
      universityId,
      campusId,
      countryCode,
      cityId,
      studyLevel,
      studyMode,
      studyLanguageId,
      intakeId,
      minTuitionFee,
      maxTuitionFee,
      tuitionFeeCurrency,
      minDuration,
      maxDuration,
      hasScholarship,
      isFeatured,
      maxIeltsTotal,
      maxToeflTotal,
      maxDuolingoTotal,
      maxRequiredGpa,
    } = filterDto;

    const where: Prisma.UniversityProgramWhereInput = {};
    // Every condition that owns its own OR goes here so nothing clobbers
    // anything else.
    const and: Prisma.UniversityProgramWhereInput[] = [];

    if (options.onlyActive) where.isActive = true;

    if (facultyId?.length) where.facultyId = { in: facultyId };
    if (departmentId?.length) where.departmentId = { in: departmentId };
    if (universityId) where.universityId = universityId;
    if (campusId) where.campuses = { some: { id: campusId } };
    if (studyLevel) where.studyLevel = studyLevel;
    if (studyMode) where.studyMode = studyMode;
    if (studyLanguageId) where.studyLanguageId = studyLanguageId;
    if (intakeId) where.intakes = { some: { intakeId } };
    if (tuitionFeeCurrency) where.tuitionFeeCurrency = tuitionFeeCurrency;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;

    if (minTuitionFee !== undefined || maxTuitionFee !== undefined) {
      where.tuitionFee = {
        gte: minTuitionFee !== undefined ? Number(minTuitionFee) : undefined,
        lte: maxTuitionFee !== undefined ? Number(maxTuitionFee) : undefined,
      };
    }

    if (minDuration !== undefined || maxDuration !== undefined) {
      where.duration = {
        gte: minDuration !== undefined ? Number(minDuration) : undefined,
        lte: maxDuration !== undefined ? Number(maxDuration) : undefined,
      };
    }

    if (hasScholarship === true) {
      where.scholarships = { some: { isVisible: true } };
    }

    const universityWhere: Prisma.UniversityWhereInput = {};
    if (countryCode !== undefined)
      universityWhere.countryCode = Number(countryCode);
    if (cityId) universityWhere.cityId = cityId;
    if (Object.keys(universityWhere).length > 0)
      where.university = universityWhere;

    if (search) {
      and.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { university: { name: { contains: search, mode: 'insensitive' } } },
          { faculty: { nameEn: { contains: search, mode: 'insensitive' } } },
          { faculty: { nameRu: { contains: search, mode: 'insensitive' } } },
          { faculty: { nameUz: { contains: search, mode: 'insensitive' } } },
          { department: { nameEn: { contains: search, mode: 'insensitive' } } },
          { department: { nameRu: { contains: search, mode: 'insensitive' } } },
          { department: { nameUz: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    // Eligibility: keep programs the student already qualifies for. A program
    // with no requirement, or with no requirement for that particular test,
    // never excludes anybody.
    const languageEligibility: Array<[LanguageTestType, number | undefined]> = [
      [LanguageTestType.IELTS, maxIeltsTotal],
      [LanguageTestType.TOEFL_IBT, maxToeflTotal],
      [LanguageTestType.DUOLINGO, maxDuolingoTotal],
    ];

    for (const [test, score] of languageEligibility) {
      if (score === undefined || score === null) continue;
      and.push({
        OR: [
          { admissionRequirement: { is: null } },
          { admissionRequirement: { languageTests: { none: { test } } } },
          {
            admissionRequirement: {
              languageTests: {
                some: {
                  test,
                  OR: [
                    { minTotal: null },
                    { minTotal: { lte: Number(score) } },
                  ],
                },
              },
            },
          },
        ],
      });
    }

    const gpaClause = await this.buildGpaEligibilityClause(maxRequiredGpa);
    if (gpaClause) and.push(gpaClause);

    if (and.length > 0) where.AND = and;

    return where;
  }

  /**
   * `minGpa / gpaScale <= studentGpa / 4`. Prisma has no column-to-column
   * arithmetic, so we enumerate the handful of distinct gpaScale values in
   * use and emit one comparison per scale.
   */
  private async buildGpaEligibilityClause(
    maxRequiredGpa?: number,
  ): Promise<Prisma.UniversityProgramWhereInput | null> {
    if (maxRequiredGpa === undefined || maxRequiredGpa === null) return null;

    const normalised = Number(maxRequiredGpa) / 4;

    const scaleRows = await this.prisma.programAdmissionRequirement.findMany({
      distinct: ['gpaScale'],
      select: { gpaScale: true },
      where: { gpaScale: { not: null } },
    });

    const scales = Array.from(
      new Set(
        scaleRows
          .map((row) => row.gpaScale)
          .filter((scale): scale is number => !!scale && scale > 0),
      ),
    );
    // A default is always meaningful even when the table is empty.
    if (!scales.includes(4)) scales.push(4);

    const branches: Prisma.UniversityProgramWhereInput[] = [
      { admissionRequirement: { is: null } },
      { admissionRequirement: { minGpa: null } },
      { admissionRequirement: { gpaScale: null } },
      ...scales.map((scale) => ({
        admissionRequirement: {
          gpaScale: scale,
          minGpa: { lte: normalised * scale },
        },
      })),
    ];

    return { OR: branches };
  }

  getSortConfig(
    sortBy?: string,
    sortDirection: 'asc' | 'desc' = 'desc',
  ): Prisma.UniversityProgramOrderByWithRelationInput {
    const sortFieldMap: Record<
      string,
      Prisma.UniversityProgramOrderByWithRelationInput
    > = {
      tuitionFee: { tuitionFee: sortDirection },
      title: { title: sortDirection },
      duration: { duration: sortDirection },
      ranking: { university: { ranking: sortDirection } },
      createdAt: { createdAt: sortDirection },
    };
    return sortFieldMap[sortBy] || sortFieldMap.createdAt;
  }
}
