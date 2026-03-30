import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../db/prisma.service';
import {
  TotalCountsResponseDto,
  ApplicationStatusStatsDto,
  GeographicDistributionDto,
  PopularProgramDto,
  UniversityStatsDto,
  GrowthStatsDto,
  ActivitySummaryDto,
  DashboardStatsResponseDto,
  DetailedApplicationStatsDto,
  UserEngagementStatsDto,
  ApplicationTrendDto,
} from './dto/statistics-response.dto';
import {
  StatisticsQueryDto,
  TrendQueryDto,
  TimePeriod,
  GroupBy,
} from './dto/statistics-query.dto';
import { Prisma, ApplicationStatus, IntakeSeason } from '@prisma/client';

// Cache TTL: 5 minutes for stats (they don't need to be real-time)
const STATS_CACHE_TTL = 300000;

@Injectable()
export class StatisticsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Get comprehensive dashboard statistics including all key metrics
   */
  async getDashboardStats(
    query?: StatisticsQueryDto,
  ): Promise<DashboardStatsResponseDto> {
    const cacheKey = `stats:dashboard:${JSON.stringify(query || {})}`;
    const cached = await this.cacheManager.get<DashboardStatsResponseDto>(cacheKey);
    if (cached) return cached;

    const dateFilter = this.buildDateFilter(
      query?.period,
      query?.startDate,
      query?.endDate,
    );

    // Execute all queries in parallel for better performance
    const [
      totalCounts,
      applicationStats,
      geographicDistribution,
      popularPrograms,
      topUniversities,
      growthStats,
      activitySummary,
    ] = await Promise.all([
      this.getTotalCounts(),
      this.getApplicationStatsByStatus(dateFilter),
      this.getGeographicDistribution(query?.limit || 10),
      this.getPopularPrograms(query?.limit || 10),
      this.getTopUniversities(query?.limit || 10),
      this.getGrowthStats(12),
      this.getActivitySummary(),
    ]);

    const result = {
      totalCounts,
      applicationStats,
      geographicDistribution,
      popularPrograms,
      topUniversities,
      growthStats,
      activitySummary,
    };

    await this.cacheManager.set(cacheKey, result, STATS_CACHE_TTL);
    return result;
  }

  /**
   * Get total counts across all entities
   */
  async getTotalCounts(): Promise<TotalCountsResponseDto> {
    const cacheKey = 'stats:totalCounts';
    const cached = await this.cacheManager.get<TotalCountsResponseDto>(cacheKey);
    if (cached) return cached;

    const [
      universities,
      programs,
      applications,
      profiles,
      countries,
      cities,
      messages,
    ] = await Promise.all([
      this.prisma.university.count(),
      this.prisma.program.count(),
      this.prisma.application.count(),
      this.prisma.profile.count(),
      this.prisma.country.count(),
      this.prisma.city.count(),
      this.prisma.message.count(),
    ]);

    const result = {
      universities,
      programs,
      applications,
      profiles,
      countries,
      cities,
      messages,
    };

    await this.cacheManager.set(cacheKey, result, STATS_CACHE_TTL);
    return result;
  }

  /**
   * Get application statistics grouped by status
   */
  async getApplicationStatsByStatus(
    dateFilter?: Prisma.ApplicationWhereInput,
  ): Promise<ApplicationStatusStatsDto> {
    const whereClause = dateFilter || {};

    const statusStats = await this.prisma.application.groupBy({
      by: ['applicationStatus'],
      where: whereClause,
      _count: {
        applicationStatus: true,
      },
    });

    // Initialize all statuses with 0
    const result: ApplicationStatusStatsDto = {
      DRAFT: 0,
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    // Populate actual counts
    statusStats.forEach((stat) => {
      result[stat.applicationStatus as keyof ApplicationStatusStatsDto] =
        stat._count.applicationStatus;
    });

    return result;
  }

  /**
   * Get geographic distribution of students and universities
   * FIXED: Eliminated N+1 queries by using raw SQL aggregation
   */
  async getGeographicDistribution(
    limit: number = 10,
  ): Promise<GeographicDistributionDto[]> {
    const cacheKey = `stats:geographic:${limit}`;
    const cached = await this.cacheManager.get<GeographicDistributionDto[]>(cacheKey);
    if (cached) return cached;

    // Single query using raw SQL to avoid N+1
    const result = await this.prisma.$queryRaw<GeographicDistributionDto[]>`
      SELECT
        c.code AS "countryCode",
        c."nameEn" AS "countryName",
        COUNT(DISTINCT u.id)::int AS "universitiesCount",
        COUNT(DISTINCT a.id)::int AS "applicationsCount",
        COUNT(DISTINCT a."profileId")::int AS "studentsCount"
      FROM "Country" c
      LEFT JOIN universities u ON u."countryCode" = c.code
      LEFT JOIN applications a ON a."preferredUniversity" = u.id
      GROUP BY c.code, c."nameEn"
      ORDER BY COUNT(DISTINCT u.id) DESC
      LIMIT ${limit}
    `;

    await this.cacheManager.set(cacheKey, result, STATS_CACHE_TTL);
    return result;
  }

  /**
   * Get most popular programs by application count
   * FIXED: Eliminated N+1 by batching aggregation
   */
  async getPopularPrograms(limit: number = 10): Promise<PopularProgramDto[]> {
    const cacheKey = `stats:popularPrograms:${limit}`;
    const cached = await this.cacheManager.get<PopularProgramDto[]>(cacheKey);
    if (cached) return cached;

    const popularPrograms = await this.prisma.program.findMany({
      select: {
        id: true,
        titleEn: true,
        _count: {
          select: {
            applications: true,
            universityPrograms: true,
          },
        },
      },
      orderBy: {
        applications: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    if (popularPrograms.length === 0) {
      return [];
    }

    // Batch aggregate: get average tuition for all program IDs in one query
    const programIds = popularPrograms.map((p) => p.id);
    const avgTuitions = await this.prisma.universityProgram.groupBy({
      by: ['programId'],
      where: {
        programId: { in: programIds },
      },
      _avg: {
        tuitionFee: true,
      },
    });

    const avgTuitionMap = new Map(
      avgTuitions.map((a) => [a.programId, a._avg.tuitionFee]),
    );

    const result: PopularProgramDto[] = popularPrograms.map((program) => ({
      programId: program.id,
      programTitle: program.titleEn || 'Unknown Program',
      applicationsCount: program._count.applications,
      universitiesCount: program._count.universityPrograms,
      averageTuitionFee: avgTuitionMap.get(program.id) || undefined,
    }));

    await this.cacheManager.set(cacheKey, result, STATS_CACHE_TTL);
    return result;
  }

  /**
   * Get universities with highest application volumes
   */
  async getTopUniversities(limit: number = 10): Promise<UniversityStatsDto[]> {
    const cacheKey = `stats:topUniversities:${limit}`;
    const cached = await this.cacheManager.get<UniversityStatsDto[]>(cacheKey);
    if (cached) return cached;

    const topUniversities = await this.prisma.university.findMany({
      select: {
        id: true,
        name: true,
        country: {
          select: {
            nameEn: true,
          },
        },
        city: {
          select: {
            nameEn: true,
          },
        },
        _count: {
          select: {
            applications: true,
            universityPrograms: true,
          },
        },
      },
      orderBy: {
        applications: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    const result = topUniversities.map((university) => ({
      universityId: university.id,
      universityName: university.name,
      applicationsCount: university._count.applications,
      programsCount: university._count.universityPrograms,
      countryName: university.country.nameEn,
      cityName: university.city.nameEn,
    }));

    await this.cacheManager.set(cacheKey, result, STATS_CACHE_TTL);
    return result;
  }

  /**
   * Get monthly growth statistics for profiles and applications
   * FIXED: Use raw SQL COUNT/GROUP BY instead of fetching ALL rows into memory
   */
  async getGrowthStats(months: number = 12): Promise<GrowthStatsDto[]> {
    const cacheKey = `stats:growth:${months}`;
    const cached = await this.cacheManager.get<GrowthStatsDto[]>(cacheKey);
    if (cached) return cached;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Use raw SQL to aggregate at the database level instead of fetching all rows
    const [profileStats, applicationStats, messageStats] = await Promise.all([
      this.prisma.$queryRaw<{ period: string; count: number }[]>`
        SELECT to_char("createdAt", 'YYYY-MM') AS period, COUNT(*)::int AS count
        FROM profiles
        WHERE "createdAt" >= ${startDate}
        GROUP BY to_char("createdAt", 'YYYY-MM')
        ORDER BY period ASC
      `,
      this.prisma.$queryRaw<{ period: string; count: number }[]>`
        SELECT to_char("createdAt", 'YYYY-MM') AS period, COUNT(*)::int AS count
        FROM applications
        WHERE "createdAt" >= ${startDate}
        GROUP BY to_char("createdAt", 'YYYY-MM')
        ORDER BY period ASC
      `,
      this.prisma.$queryRaw<{ period: string; count: number }[]>`
        SELECT to_char("createdAt", 'YYYY-MM') AS period, COUNT(*)::int AS count
        FROM "Message"
        WHERE "createdAt" >= ${startDate}
        GROUP BY to_char("createdAt", 'YYYY-MM')
        ORDER BY period ASC
      `,
    ]);

    const profileMap = new Map(profileStats.map((r) => [r.period, Number(r.count)]));
    const appMap = new Map(applicationStats.map((r) => [r.period, Number(r.count)]));
    const msgMap = new Map(messageStats.map((r) => [r.period, Number(r.count)]));

    // Generate result array with all months in the range
    const result: GrowthStatsDto[] = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const month = currentDate.toISOString().substring(0, 7);

      result.push({
        period: month,
        newProfiles: profileMap.get(month) || 0,
        newApplications: appMap.get(month) || 0,
        messagesCount: msgMap.get(month) || 0,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    await this.cacheManager.set(cacheKey, result, STATS_CACHE_TTL);
    return result;
  }

  /**
   * Get activity summary and key metrics
   */
  async getActivitySummary(): Promise<ActivitySummaryDto> {
    const cacheKey = 'stats:activitySummary';
    const cached = await this.cacheManager.get<ActivitySummaryDto>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      activeUsers,
      thisMonthApplications,
      lastMonthApplications,
      totalApplications,
      totalUsers,
      popularSeason,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          profile: {
            isNot: null,
          },
        },
      }),
      this.prisma.application.count({
        where: {
          createdAt: {
            gte: thisMonth,
          },
        },
      }),
      this.prisma.application.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
      this.prisma.application.count(),
      this.prisma.user.count(),
      this.prisma.application.groupBy({
        by: ['intakeSeason'],
        _count: {
          intakeSeason: true,
        },
        orderBy: {
          _count: {
            intakeSeason: 'desc',
          },
        },
        take: 1,
      }),
    ]);

    const monthOverMonthGrowth =
      lastMonthApplications > 0
        ? ((thisMonthApplications - lastMonthApplications) /
            lastMonthApplications) *
          100
        : 0;

    const averageApplicationsPerUser =
      activeUsers > 0 ? totalApplications / activeUsers : 0;

    const result = {
      activeUsers,
      thisMonthApplications,
      lastMonthApplications,
      monthOverMonthGrowth: Math.round(monthOverMonthGrowth * 100) / 100,
      averageApplicationsPerUser:
        Math.round(averageApplicationsPerUser * 100) / 100,
      popularIntakeSeason: popularSeason[0]?.intakeSeason || 'FALL',
    };

    await this.cacheManager.set(cacheKey, result, STATS_CACHE_TTL);
    return result;
  }

  /**
   * Get detailed application statistics with multiple groupings
   */
  async getDetailedApplicationStats(
    query?: StatisticsQueryDto,
  ): Promise<DetailedApplicationStatsDto> {
    const cacheKey = `stats:detailedApps:${JSON.stringify(query || {})}`;
    const cached = await this.cacheManager.get<DetailedApplicationStatsDto>(cacheKey);
    if (cached) return cached;

    const dateFilter = this.buildDateFilter(
      query?.period,
      query?.startDate,
      query?.endDate,
    );

    const [byStatus, byCountry, byIntakeSeason, byIntakeYear, trends] =
      await Promise.all([
        this.getApplicationStatsByStatus(dateFilter),
        this.getApplicationsByCountry(dateFilter, query?.limit || 10),
        this.getApplicationsByIntakeSeason(dateFilter),
        this.getApplicationsByIntakeYear(dateFilter),
        this.getApplicationTrends(30),
      ]);

    const result = {
      byStatus,
      byCountry,
      byIntakeSeason,
      byIntakeYear,
      trends,
    };

    await this.cacheManager.set(cacheKey, result, STATS_CACHE_TTL);
    return result;
  }

  /**
   * Get user engagement statistics
   */
  async getUserEngagementStats(): Promise<UserEngagementStatsDto> {
    const cacheKey = 'stats:engagement';
    const cached = await this.cacheManager.get<UserEngagementStatsDto>(cacheKey);
    if (cached) return cached;

    const [
      totalUsers,
      usersWithProfiles,
      usersWithApplications,
      totalMessages,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          profile: {
            isNot: null,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          profile: {
            applications: {
              some: {},
            },
          },
        },
      }),
      this.prisma.message.count(),
    ]);

    const profileCompletionRate =
      totalUsers > 0 ? (usersWithProfiles / totalUsers) * 100 : 0;
    const applicationConversionRate =
      usersWithProfiles > 0
        ? (usersWithApplications / usersWithProfiles) * 100
        : 0;
    const averageMessagesPerUser =
      totalUsers > 0 ? totalMessages / totalUsers : 0;

    const result = {
      totalUsers,
      usersWithProfiles,
      usersWithApplications,
      averageMessagesPerUser: Math.round(averageMessagesPerUser * 100) / 100,
      profileCompletionRate: Math.round(profileCompletionRate * 100) / 100,
      applicationConversionRate:
        Math.round(applicationConversionRate * 100) / 100,
    };

    await this.cacheManager.set(cacheKey, result, STATS_CACHE_TTL);
    return result;
  }

  /**
   * Get application trends over time
   * FIXED: Use raw SQL date truncation instead of groupBy on exact timestamps
   */
  async getApplicationTrends(
    days: number = 30,
  ): Promise<ApplicationTrendDto[]> {
    const cacheKey = `stats:trends:${days}`;
    const cached = await this.cacheManager.get<ApplicationTrendDto[]>(cacheKey);
    if (cached) return cached;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await this.prisma.$queryRaw<ApplicationTrendDto[]>`
      SELECT
        to_char("createdAt", 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS count
      FROM applications
      WHERE "createdAt" >= ${startDate}
      GROUP BY to_char("createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    const result = trends.map((t) => ({ date: t.date, count: Number(t.count) }));

    await this.cacheManager.set(cacheKey, result, STATS_CACHE_TTL);
    return result;
  }

  // Helper methods

  /**
   * Build date filter based on period or custom dates
   */
  private buildDateFilter(
    period?: TimePeriod,
    startDate?: string,
    endDate?: string,
  ): Prisma.ApplicationWhereInput | undefined {
    if (startDate && endDate) {
      return {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    if (period) {
      const now = new Date();
      let start: Date;

      switch (period) {
        case TimePeriod.LAST_7_DAYS:
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case TimePeriod.LAST_30_DAYS:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case TimePeriod.LAST_3_MONTHS:
          start = new Date(
            now.getFullYear(),
            now.getMonth() - 3,
            now.getDate(),
          );
          break;
        case TimePeriod.LAST_6_MONTHS:
          start = new Date(
            now.getFullYear(),
            now.getMonth() - 6,
            now.getDate(),
          );
          break;
        case TimePeriod.LAST_YEAR:
          start = new Date(
            now.getFullYear() - 1,
            now.getMonth(),
            now.getDate(),
          );
          break;
        default:
          return undefined;
      }

      return {
        createdAt: {
          gte: start,
        },
      };
    }

    return undefined;
  }

  /**
   * Get applications grouped by country
   * FIXED: Batch country lookups instead of N+1
   */
  private async getApplicationsByCountry(
    dateFilter?: Prisma.ApplicationWhereInput,
    limit: number = 10,
  ) {
    const applications = await this.prisma.application.groupBy({
      by: ['preferredCountry'],
      where: dateFilter,
      _count: {
        preferredCountry: true,
      },
      orderBy: {
        _count: {
          preferredCountry: 'desc',
        },
      },
      take: limit,
    });

    // Batch fetch all country names in one query
    const countryCodes = applications
      .map((app) => parseInt(app.preferredCountry))
      .filter((code) => !isNaN(code));

    const countries = countryCodes.length > 0
      ? await this.prisma.country.findMany({
          where: { code: { in: countryCodes } },
          select: { code: true, nameEn: true },
        })
      : [];

    const countryMap = new Map(
      countries.map((c) => [c.code, c.nameEn]),
    );

    return applications.map((app) => {
      const countryCode = parseInt(app.preferredCountry);
      return {
        countryCode: isNaN(countryCode) ? 0 : countryCode,
        countryName: countryMap.get(countryCode) || app.preferredCountry,
        count: app._count.preferredCountry,
      };
    });
  }

  /**
   * Get applications grouped by intake season
   */
  private async getApplicationsByIntakeSeason(
    dateFilter?: Prisma.ApplicationWhereInput,
  ) {
    const seasons = await this.prisma.application.groupBy({
      by: ['intakeSeason'],
      where: dateFilter,
      _count: {
        intakeSeason: true,
      },
      orderBy: {
        _count: {
          intakeSeason: 'desc',
        },
      },
    });

    return seasons.map((season) => ({
      season: season.intakeSeason,
      count: season._count.intakeSeason,
    }));
  }

  /**
   * Get applications grouped by intake year
   */
  private async getApplicationsByIntakeYear(
    dateFilter?: Prisma.ApplicationWhereInput,
  ) {
    const years = await this.prisma.application.groupBy({
      by: ['intakeYear'],
      where: dateFilter,
      _count: {
        intakeYear: true,
      },
      orderBy: {
        intakeYear: 'desc',
      },
    });

    return years.map((year) => ({
      year: year.intakeYear,
      count: year._count.intakeYear,
    }));
  }
}
