import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UniversityFilterDto } from './dto/university-filter.dto';
import { UniversitiesByProgramsFilterDto } from './dto/universities-by-programs-filter.dto';

@Injectable()
export class UniversitiesRepository {
  buildUniversityWhereClause(
    filterDto: UniversityFilterDto,
  ): Prisma.UniversityWhereInput {
    const {
      countryCode,
      cityId,
      universityId,
      type,
      minRanking,
      maxRanking,
      minEstablished,
      maxEstablished,
      minAcceptanceRate,
      maxAcceptanceRate,
      minApplicationFee,
      maxApplicationFee,
      applicationFeeCurrency,
      minTuitionFee,
      maxTuitionFee,
      tuitionFeeCurrency,
      studyLevel,
      programs,
      search,
      intake,
      studyLanguage,
      minIeltsTotal,
      maxIeltsTotal,
      minIeltsReading,
      maxIeltsReading,
      minIeltsWriting,
      maxIeltsWriting,
      minIeltsSpeaking,
      maxIeltsSpeaking,
      minIeltsListening,
      maxIeltsListening,
      minGpa,
      maxGpa,
    } = filterDto;

    const where: Prisma.UniversityWhereInput = {};

    if (countryCode) where.countryCode = Number(countryCode);
    if (cityId) where.cityId = cityId;
    if (universityId) where.id = universityId;
    if (type) where.type = type;

    // Numeric ranges
    if (minRanking !== undefined || maxRanking !== undefined) {
      where.ranking = {
        gte: minRanking ? Number(minRanking) : undefined,
        lte: maxRanking ? Number(maxRanking) : undefined,
      };
    }
    if (minEstablished !== undefined || maxEstablished !== undefined) {
      where.established = {
        gte: minEstablished ? Number(minEstablished) : undefined,
        lte: maxEstablished ? Number(maxEstablished) : undefined,
      };
    }
    if (minAcceptanceRate !== undefined || maxAcceptanceRate !== undefined) {
      where.acceptanceRate = {
        gte: minAcceptanceRate ? Number(minAcceptanceRate) : undefined,
        lte: maxAcceptanceRate ? Number(maxAcceptanceRate) : undefined,
      };
    }
    if (minApplicationFee !== undefined || maxApplicationFee !== undefined) {
      where.avgApplicationFee = {
        gte: minApplicationFee ? Number(minApplicationFee) : undefined,
        lte: maxApplicationFee ? Number(maxApplicationFee) : undefined,
      };
    }
    if (applicationFeeCurrency)
      where.applicationFeeCurrency = applicationFeeCurrency;

    // Complex Program Filters
    const programIds = programs
      ? Array.isArray(programs)
        ? programs
        : `${programs}`.split(',').filter(Boolean)
      : [];
    const hasProgramDetailsFilter =
      minTuitionFee !== undefined ||
      maxTuitionFee !== undefined ||
      tuitionFeeCurrency ||
      studyLevel ||
      studyLanguage ||
      intake;
    const hasProgramIdsFilter = programIds.length > 0;

    if (hasProgramIdsFilter || hasProgramDetailsFilter) {
      const universityProgramFilter: Prisma.UniversityProgramListRelationFilter =
        {
          some: {},
        };

      if (hasProgramIdsFilter) {
        universityProgramFilter.some.programId = { in: programIds };
      }

      if (hasProgramDetailsFilter) {
        if (minTuitionFee !== undefined || maxTuitionFee !== undefined) {
          universityProgramFilter.some.tuitionFee = {
            gte: minTuitionFee ? Number(minTuitionFee) : undefined,
            lte: maxTuitionFee ? Number(maxTuitionFee) : undefined,
          };
        }
        if (tuitionFeeCurrency)
          universityProgramFilter.some.tuitionFeeCurrency = tuitionFeeCurrency;
        if (studyLevel) universityProgramFilter.some.studyLevel = studyLevel;
        if (studyLanguage)
          universityProgramFilter.some.studyLanguage = studyLanguage;
        if (intake) {
          universityProgramFilter.some.intakes = { some: { intakeId: intake } };
        }
      }

      where.universityPrograms = universityProgramFilter;
    }

    // Admission requirements: IELTS (per section) and GPA
    const ieltsFilters = [
      { path: ['ielts', 'total'], min: minIeltsTotal, max: maxIeltsTotal },
      { path: ['ielts', 'sections', 'reading'], min: minIeltsReading, max: maxIeltsReading },
      { path: ['ielts', 'sections', 'writing'], min: minIeltsWriting, max: maxIeltsWriting },
      { path: ['ielts', 'sections', 'speaking'], min: minIeltsSpeaking, max: maxIeltsSpeaking },
      { path: ['ielts', 'sections', 'listening'], min: minIeltsListening, max: maxIeltsListening },
    ].filter((f) => f.min !== undefined || f.max !== undefined);

    if (ieltsFilters.length > 0 || minGpa !== undefined || maxGpa !== undefined) {
      const admissionAndConditions: Prisma.AdmissionRequirementWhereInput[] = [];

      for (const f of ieltsFilters) {
        const cond: any = { languageRequirements: { path: f.path } };
        if (f.min !== undefined) cond.languageRequirements.gte = f.min;
        if (f.max !== undefined) cond.languageRequirements.lte = f.max;
        admissionAndConditions.push(cond);
      }

      if (minGpa !== undefined || maxGpa !== undefined) {
        admissionAndConditions.push({
          minGpa: {
            ...(minGpa !== undefined && { gte: String(minGpa) }),
            ...(maxGpa !== undefined && { lte: String(maxGpa) }),
          },
        });
      }

      where.admissionRequirements = {
        some: admissionAndConditions.length === 1
          ? admissionAndConditions[0]
          : { AND: admissionAndConditions },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { website: { contains: search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  buildUniversityProgramWhereClause(
    filterDto: UniversitiesByProgramsFilterDto,
  ): Prisma.UniversityProgramWhereInput {
    const {
      countryCode,
      cityId,
      minRanking,
      maxRanking,
      minTuitionFee,
      maxTuitionFee,
      tuitionFeeCurrency,
      studyLevel,
      search,
      intake,
      universityId,
      campusId,
      studyLanguage,
      minIeltsTotal,
      maxIeltsTotal,
      minIeltsReading,
      maxIeltsReading,
      minIeltsWriting,
      maxIeltsWriting,
      minIeltsSpeaking,
      maxIeltsSpeaking,
      minIeltsListening,
      maxIeltsListening,
      minGpa,
      maxGpa,
    } = filterDto;

    const where: Prisma.UniversityProgramWhereInput = {};

    if (universityId) where.universityId = universityId;
    if (campusId) where.campuses = { some: { id: campusId } };

    const universityWhere: any = {};
    if (countryCode) universityWhere.countryCode = Number(countryCode);
    if (cityId) universityWhere.cityId = cityId;

    if (minRanking !== undefined || maxRanking !== undefined) {
      universityWhere.ranking = {
        gte: minRanking ? Number(minRanking) : undefined,
        lte: maxRanking ? Number(maxRanking) : undefined,
      };
    }

    if (Object.keys(universityWhere).length > 0) {
      where.university = universityWhere;
    }

    if (minTuitionFee !== undefined || maxTuitionFee !== undefined) {
      where.tuitionFee = {
        gte: minTuitionFee ? Number(minTuitionFee) : undefined,
        lte: maxTuitionFee ? Number(maxTuitionFee) : undefined,
      };
    }

    if (tuitionFeeCurrency) where.tuitionFeeCurrency = tuitionFeeCurrency;
    if (studyLevel) where.studyLevel = studyLevel;
    if (studyLanguage) where.studyLanguage = studyLanguage;
    if (intake) where.intakes = { some: { intakeId: intake } };

    // IELTS (per section) and GPA filters via university's admission requirements
    const ieltsFilters = [
      { path: ['ielts', 'total'], min: minIeltsTotal, max: maxIeltsTotal },
      { path: ['ielts', 'sections', 'reading'], min: minIeltsReading, max: maxIeltsReading },
      { path: ['ielts', 'sections', 'writing'], min: minIeltsWriting, max: maxIeltsWriting },
      { path: ['ielts', 'sections', 'speaking'], min: minIeltsSpeaking, max: maxIeltsSpeaking },
      { path: ['ielts', 'sections', 'listening'], min: minIeltsListening, max: maxIeltsListening },
    ].filter((f) => f.min !== undefined || f.max !== undefined);

    if (ieltsFilters.length > 0 || minGpa !== undefined || maxGpa !== undefined) {
      const admissionAndConditions: Prisma.AdmissionRequirementWhereInput[] = [];

      for (const f of ieltsFilters) {
        const cond: any = { languageRequirements: { path: f.path } };
        if (f.min !== undefined) cond.languageRequirements.gte = f.min;
        if (f.max !== undefined) cond.languageRequirements.lte = f.max;
        admissionAndConditions.push(cond);
      }

      if (minGpa !== undefined || maxGpa !== undefined) {
        admissionAndConditions.push({
          minGpa: {
            ...(minGpa !== undefined && { gte: String(minGpa) }),
            ...(maxGpa !== undefined && { lte: String(maxGpa) }),
          },
        });
      }

      const admissionRequirementsFilter = {
        some: admissionAndConditions.length === 1
          ? admissionAndConditions[0]
          : { AND: admissionAndConditions },
      };

      where.university = {
        ...((where.university as any) || {}),
        admissionRequirements: admissionRequirementsFilter,
      };
    }

    if (search) {
      where.OR = [
        { university: { name: { contains: search, mode: 'insensitive' } } },
        { program: { titleUz: { contains: search, mode: 'insensitive' } } },
        { program: { titleRu: { contains: search, mode: 'insensitive' } } },
        { program: { titleEn: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  getSortConfig(sortBy: string, sortDirection: 'asc' | 'desc'): any {
    const sortFieldMap: Record<string, any> = {
      ranking: { ranking: sortDirection },
      established: { established: sortDirection },
      acceptanceRate: { acceptanceRate: sortDirection },
      applicationFee: { avgApplicationFee: sortDirection },
      name: { name: sortDirection },
    };
    return sortFieldMap[sortBy] || { ranking: sortDirection };
  }

  getUniversityProgramSortConfig(
    sortBy: string,
    sortDirection: 'asc' | 'desc',
  ): any {
    const sortFieldMap: Record<string, any> = {
      ranking: { university: { ranking: sortDirection } },
      tuitionFee: { tuitionFee: sortDirection },
      universityName: { university: { name: sortDirection } },
      established: { university: { established: sortDirection } },
    };
    return sortFieldMap[sortBy] || sortFieldMap.ranking;
  }
}
