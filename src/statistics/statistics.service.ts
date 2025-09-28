import { Injectable } from '@nestjs/common';
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
import { StatisticsQueryDto, TrendQueryDto, TimePeriod, GroupBy } from './dto/statistics-query.dto';
import { Prisma, ApplicationStatus, IntakeSeason } from '@prisma/client';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get comprehensive dashboard statistics including all key metrics
   */
  async getDashboardStats(query?: StatisticsQueryDto): Promise<DashboardStatsResponseDto> {
    const dateFilter = this.buildDateFilter(query?.period, query?.startDate, query?.endDate);

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
      this.getGrowthStats(12), // Last 12 months
      this.getActivitySummary(),
    ]);

    return {
      totalCounts,
      applicationStats,
      geographicDistribution,
      popularPrograms,
      topUniversities,
      growthStats,
      activitySummary,
    };
  }

  /**
   * Get total counts across all entities
   */
  async getTotalCounts(): Promise<TotalCountsResponseDto> {
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

    return {
      universities,
      programs,
      applications,
      profiles,
      countries,
      cities,
      messages,
    };
  }

  /**
   * Get application statistics grouped by status
   */
  async getApplicationStatsByStatus(dateFilter?: Prisma.ApplicationWhereInput): Promise<ApplicationStatusStatsDto> {
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
      result[stat.applicationStatus as keyof ApplicationStatusStatsDto] = stat._count.applicationStatus;
    });

    return result;
  }

  /**
   * Get geographic distribution of students and universities
   */
  async getGeographicDistribution(limit: number = 10): Promise<GeographicDistributionDto[]> {
    const countryStats = await this.prisma.country.findMany({
      select: {
        code: true,
        nameEn: true,
        _count: {
          select: {
            universities: true,
          },
        },
      },
      orderBy: {
        universities: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    // Get application counts and student counts for each country
    const result: GeographicDistributionDto[] = [];
    
    for (const country of countryStats) {
      const [applicationsCount, studentsCount] = await Promise.all([
        this.prisma.application.count({
          where: {
            university: {
              countryCode: country.code,
            },
          },
        }),
        this.prisma.profile.count({
          where: {
            applications: {
              some: {
                university: {
                  countryCode: country.code,
                },
              },
            },
          },
        }),
      ]);

      result.push({
        countryCode: country.code,
        countryName: country.nameEn,
        universitiesCount: country._count.universities,
        applicationsCount,
        studentsCount,
      });
    }

    return result;
  }

  /**
   * Get most popular programs by application count
   */
  async getPopularPrograms(limit: number = 10): Promise<PopularProgramDto[]> {
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

    // Get average tuition fee for each program
    const result: PopularProgramDto[] = [];
    
    for (const program of popularPrograms) {
      const avgTuitionResult = await this.prisma.universityProgram.aggregate({
        where: {
          programId: program.id,
        },
        _avg: {
          tuitionFee: true,
        },
      });

      result.push({
        programId: program.id,
        programTitle: program.titleEn || 'Unknown Program',
        applicationsCount: program._count.applications,
        universitiesCount: program._count.universityPrograms,
        averageTuitionFee: avgTuitionResult._avg.tuitionFee || undefined,
      });
    }

    return result;
  }

  /**
   * Get universities with highest application volumes
   */
  async getTopUniversities(limit: number = 10): Promise<UniversityStatsDto[]> {
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

    return topUniversities.map((university) => ({
      universityId: university.id,
      universityName: university.name,
      applicationsCount: university._count.applications,
      programsCount: university._count.universityPrograms,
      countryName: university.country.nameEn,
      cityName: university.city.nameEn,
    }));
  }

  /**
   * Get monthly growth statistics for profiles and applications
   */
  async getGrowthStats(months: number = 12): Promise<GrowthStatsDto[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get data using Prisma's findMany instead of raw SQL
    const [profiles, applications, messages] = await Promise.all([
      this.prisma.profile.findMany({
        select: {
          createdAt: true,
        },
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.application.findMany({
        select: {
          createdAt: true,
        },
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.message.findMany({
        select: {
          createdAt: true,
        },
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    // Group by month
    const monthlyData = new Map<string, { newProfiles: number; newApplications: number; messagesCount: number }>();

    // Process profiles
    profiles.forEach((profile) => {
      const month = profile.createdAt.toISOString().substring(0, 7); // YYYY-MM format
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { newProfiles: 0, newApplications: 0, messagesCount: 0 });
      }
      monthlyData.get(month)!.newProfiles++;
    });

    // Process applications
    applications.forEach((application) => {
      const month = application.createdAt.toISOString().substring(0, 7); // YYYY-MM format
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { newProfiles: 0, newApplications: 0, messagesCount: 0 });
      }
      monthlyData.get(month)!.newApplications++;
    });

    // Process messages
    messages.forEach((message) => {
      const month = message.createdAt.toISOString().substring(0, 7); // YYYY-MM format
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { newProfiles: 0, newApplications: 0, messagesCount: 0 });
      }
      monthlyData.get(month)!.messagesCount++;
    });

    // Generate result array with all months in the range
    const result: GrowthStatsDto[] = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const month = currentDate.toISOString().substring(0, 7); // YYYY-MM format
      const data = monthlyData.get(month) || { newProfiles: 0, newApplications: 0, messagesCount: 0 };
      
      result.push({
        period: month,
        newProfiles: data.newProfiles,
        newApplications: data.newApplications,
        messagesCount: data.messagesCount,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return result;
  }

  /**
   * Get activity summary and key metrics
   */
  async getActivitySummary(): Promise<ActivitySummaryDto> {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

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

    const monthOverMonthGrowth = lastMonthApplications > 0 
      ? ((thisMonthApplications - lastMonthApplications) / lastMonthApplications) * 100 
      : 0;

    const averageApplicationsPerUser = activeUsers > 0 ? totalApplications / activeUsers : 0;

    return {
      activeUsers,
      thisMonthApplications,
      lastMonthApplications,
      monthOverMonthGrowth: Math.round(monthOverMonthGrowth * 100) / 100,
      averageApplicationsPerUser: Math.round(averageApplicationsPerUser * 100) / 100,
      popularIntakeSeason: popularSeason[0]?.intakeSeason || 'FALL',
    };
  }

  /**
   * Get detailed application statistics with multiple groupings
   */
  async getDetailedApplicationStats(query?: StatisticsQueryDto): Promise<DetailedApplicationStatsDto> {
    const dateFilter = this.buildDateFilter(query?.period, query?.startDate, query?.endDate);

    const [byStatus, byCountry, byIntakeSeason, byIntakeYear, trends] = await Promise.all([
      this.getApplicationStatsByStatus(dateFilter),
      this.getApplicationsByCountry(dateFilter, query?.limit || 10),
      this.getApplicationsByIntakeSeason(dateFilter),
      this.getApplicationsByIntakeYear(dateFilter),
      this.getApplicationTrends(30), // Last 30 days
    ]);

    return {
      byStatus,
      byCountry,
      byIntakeSeason,
      byIntakeYear,
      trends,
    };
  }

  /**
   * Get user engagement statistics
   */
  async getUserEngagementStats(): Promise<UserEngagementStatsDto> {
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

    const profileCompletionRate = totalUsers > 0 ? (usersWithProfiles / totalUsers) * 100 : 0;
    const applicationConversionRate = usersWithProfiles > 0 ? (usersWithApplications / usersWithProfiles) * 100 : 0;
    const averageMessagesPerUser = totalUsers > 0 ? totalMessages / totalUsers : 0;

    return {
      totalUsers,
      usersWithProfiles,
      usersWithApplications,
      averageMessagesPerUser: Math.round(averageMessagesPerUser * 100) / 100,
      profileCompletionRate: Math.round(profileCompletionRate * 100) / 100,
      applicationConversionRate: Math.round(applicationConversionRate * 100) / 100,
    };
  }

  /**
   * Get application trends over time
   */
  async getApplicationTrends(days: number = 30): Promise<ApplicationTrendDto[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Use Prisma's groupBy instead of raw SQL
    const trends = await this.prisma.application.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date (day) manually since Prisma doesn't support date truncation in groupBy
    const dailyGroups = new Map<string, number>();
    
    trends.forEach((trend) => {
      const date = trend.createdAt.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      dailyGroups.set(date, (dailyGroups.get(date) || 0) + trend._count._all);
    });

    // Convert to array and sort by date
    return Array.from(dailyGroups.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Helper methods

  /**
   * Build date filter based on period or custom dates
   */
  private buildDateFilter(
    period?: TimePeriod,
    startDate?: string,
    endDate?: string
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
          start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case TimePeriod.LAST_6_MONTHS:
          start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case TimePeriod.LAST_YEAR:
          start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
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
   */
  private async getApplicationsByCountry(
    dateFilter?: Prisma.ApplicationWhereInput,
    limit: number = 10
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

    // Get country names
    const result = [];
    for (const app of applications) {
      // Try to parse country code if it's numeric, otherwise use as string
      const countryCode = parseInt(app.preferredCountry);
      let countryName = app.preferredCountry;

      if (!isNaN(countryCode)) {
        const country = await this.prisma.country.findUnique({
          where: { code: countryCode },
          select: { nameEn: true },
        });
        countryName = country?.nameEn || app.preferredCountry;
      }

      result.push({
        countryCode: isNaN(countryCode) ? 0 : countryCode,
        countryName,
        count: app._count.preferredCountry,
      });
    }

    return result;
  }

  /**
   * Get applications grouped by intake season
   */
  private async getApplicationsByIntakeSeason(dateFilter?: Prisma.ApplicationWhereInput) {
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
  private async getApplicationsByIntakeYear(dateFilter?: Prisma.ApplicationWhereInput) {
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