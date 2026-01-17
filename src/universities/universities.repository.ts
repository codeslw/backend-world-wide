import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UniversityFilterDto } from './dto/university-filter.dto';
import { UniversitiesByProgramsFilterDto } from './dto/universities-by-programs-filter.dto';

@Injectable()
export class UniversitiesRepository {
    buildUniversityWhereClause(filterDto: UniversityFilterDto): Prisma.UniversityWhereInput {
        const {
            countryCode, cityId, type, minRanking, maxRanking,
            minEstablished, maxEstablished, minAcceptanceRate, maxAcceptanceRate,
            minApplicationFee, maxApplicationFee, applicationFeeCurrency,
            minTuitionFee, maxTuitionFee, tuitionFeeCurrency, studyLevel,
            programs, search, intake,
        } = filterDto;

        const where: Prisma.UniversityWhereInput = {};

        if (countryCode) where.countryCode = Number(countryCode);
        if (cityId) where.cityId = cityId;
        if (type) where.type = type;

        // Numeric ranges
        if (minRanking !== undefined || maxRanking !== undefined) {
            where.ranking = { gte: minRanking ? Number(minRanking) : undefined, lte: maxRanking ? Number(maxRanking) : undefined };
        }
        if (minEstablished !== undefined || maxEstablished !== undefined) {
            where.established = { gte: minEstablished ? Number(minEstablished) : undefined, lte: maxEstablished ? Number(maxEstablished) : undefined };
        }
        if (minAcceptanceRate !== undefined || maxAcceptanceRate !== undefined) {
            where.acceptanceRate = { gte: minAcceptanceRate ? Number(minAcceptanceRate) : undefined, lte: maxAcceptanceRate ? Number(maxAcceptanceRate) : undefined };
        }
        if (minApplicationFee !== undefined || maxApplicationFee !== undefined) {
            where.avgApplicationFee = { gte: minApplicationFee ? Number(minApplicationFee) : undefined, lte: maxApplicationFee ? Number(maxApplicationFee) : undefined };
        }
        if (applicationFeeCurrency) where.applicationFeeCurrency = applicationFeeCurrency;

        // Complex Program Filters
        const programIds = programs ? (Array.isArray(programs) ? programs : `${programs}`.split(',').filter(Boolean)) : [];
        const hasProgramDetailsFilter = minTuitionFee !== undefined || maxTuitionFee !== undefined || tuitionFeeCurrency || studyLevel || intake;
        const hasProgramIdsFilter = programIds.length > 0;

        if (hasProgramIdsFilter || hasProgramDetailsFilter) {
            const universityProgramFilter: Prisma.UniversityProgramListRelationFilter = {
                some: {}
            };

            if (hasProgramIdsFilter) {
                universityProgramFilter.some.programId = { in: programIds };
            }

            if (hasProgramDetailsFilter) {
                if (minTuitionFee !== undefined || maxTuitionFee !== undefined) {
                    universityProgramFilter.some.tuitionFee = {
                        gte: minTuitionFee ? Number(minTuitionFee) : undefined,
                        lte: maxTuitionFee ? Number(maxTuitionFee) : undefined
                    };
                }
                if (tuitionFeeCurrency) universityProgramFilter.some.tuitionFeeCurrency = tuitionFeeCurrency;
                if (studyLevel) universityProgramFilter.some.studyLevel = studyLevel;
                if (intake) {
                    universityProgramFilter.some.intakes = { some: { intakeId: intake } };
                }
            }

            where.universityPrograms = universityProgramFilter;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { descriptionUz: { contains: search, mode: 'insensitive' } },
                { descriptionRu: { contains: search, mode: 'insensitive' } },
                { descriptionEn: { contains: search, mode: 'insensitive' } },
                { website: { contains: search, mode: 'insensitive' } },
            ];
        }

        return where;
    }

    buildUniversityProgramWhereClause(filterDto: UniversitiesByProgramsFilterDto): Prisma.UniversityProgramWhereInput {
        const {
            countryCode, cityId, minRanking, maxRanking,
            minTuitionFee, maxTuitionFee, tuitionFeeCurrency, studyLevel,
            search, intake,
        } = filterDto;

        const where: Prisma.UniversityProgramWhereInput = {
            university: {},
        };

        if (countryCode) where.university.countryCode = Number(countryCode);
        if (cityId) where.university.cityId = cityId;

        if (minRanking !== undefined || maxRanking !== undefined) {
            where.university.ranking = {
                gte: minRanking ? Number(minRanking) : undefined,
                lte: maxRanking ? Number(maxRanking) : undefined
            };
        }

        if (minTuitionFee !== undefined || maxTuitionFee !== undefined) {
            where.tuitionFee = {
                gte: minTuitionFee ? Number(minTuitionFee) : undefined,
                lte: maxTuitionFee ? Number(maxTuitionFee) : undefined
            };
        }

        if (tuitionFeeCurrency) where.tuitionFeeCurrency = tuitionFeeCurrency;
        if (studyLevel) where.studyLevel = studyLevel;
        if (intake) where.intakes = { some: { intakeId: intake } };

        if (search) {
            where.OR = [
                { university: { name: { contains: search, mode: 'insensitive' } } },
                { university: { descriptionUz: { contains: search, mode: 'insensitive' } } },
                { university: { descriptionRu: { contains: search, mode: 'insensitive' } } },
                { university: { descriptionEn: { contains: search, mode: 'insensitive' } } },
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

    getUniversityProgramSortConfig(sortBy: string, sortDirection: 'asc' | 'desc'): any {
        const sortFieldMap: Record<string, any> = {
            ranking: { university: { ranking: sortDirection } },
            tuitionFee: { tuitionFee: sortDirection },
            universityName: { university: { name: sortDirection } },
            established: { university: { established: sortDirection } },
        };
        return sortFieldMap[sortBy] || sortFieldMap.ranking;
    }
}
