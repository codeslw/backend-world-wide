import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TotalCountsResponseDto {
  @ApiProperty({ description: 'Total number of universities', example: 150 })
  universities: number;

  @ApiProperty({ description: 'Total number of programs', example: 2500 })
  programs: number;

  @ApiProperty({ description: 'Total number of applications', example: 5000 })
  applications: number;

  @ApiProperty({ description: 'Total number of user profiles', example: 8000 })
  profiles: number;

  @ApiProperty({ description: 'Total number of countries', example: 45 })
  countries: number;

  @ApiProperty({ description: 'Total number of cities', example: 300 })
  cities: number;

  @ApiProperty({ description: 'Total number of messages exchanged', example: 12000 })
  messages: number;
}

export class ApplicationStatusStatsDto {
  @ApiProperty({ description: 'Number of draft applications', example: 1200 })
  DRAFT: number;

  @ApiProperty({ description: 'Number of submitted applications', example: 2500 })
  SUBMITTED: number;

  @ApiProperty({ description: 'Number of applications under review', example: 800 })
  UNDER_REVIEW: number;

  @ApiProperty({ description: 'Number of approved applications', example: 1000 })
  APPROVED: number;

  @ApiProperty({ description: 'Number of rejected applications', example: 500 })
  REJECTED: number;
}

export class GeographicDistributionDto {
  @ApiProperty({ description: 'Country code', example: 860 })
  countryCode: number;

  @ApiProperty({ description: 'Country name', example: 'Uzbekistan' })
  countryName: string;

  @ApiProperty({ description: 'Number of universities', example: 25 })
  universitiesCount: number;

  @ApiProperty({ description: 'Number of applications', example: 1500 })
  applicationsCount: number;

  @ApiProperty({ description: 'Number of students (profiles)', example: 3000 })
  studentsCount: number;
}

export class PopularProgramDto {
  @ApiProperty({ description: 'Program ID', example: 'abc123-def456' })
  programId: string;

  @ApiProperty({ description: 'Program title', example: 'Computer Science' })
  programTitle: string;

  @ApiProperty({ description: 'Number of applications', example: 450 })
  applicationsCount: number;

  @ApiProperty({ description: 'Number of universities offering this program', example: 15 })
  universitiesCount: number;

  @ApiPropertyOptional({ description: 'Average tuition fee in USD', example: 5000 })
  averageTuitionFee?: number;
}

export class UniversityStatsDto {
  @ApiProperty({ description: 'University ID', example: 'uni123-abc456' })
  universityId: string;

  @ApiProperty({ description: 'University name', example: 'Tashkent University of Information Technologies' })
  universityName: string;

  @ApiProperty({ description: 'Number of applications received', example: 300 })
  applicationsCount: number;

  @ApiProperty({ description: 'Number of programs offered', example: 25 })
  programsCount: number;

  @ApiProperty({ description: 'Country name', example: 'Uzbekistan' })
  countryName: string;

  @ApiProperty({ description: 'City name', example: 'Tashkent' })
  cityName: string;
}

export class GrowthStatsDto {
  @ApiProperty({ description: 'Period (YYYY-MM or YYYY)', example: '2024-03' })
  period: string;

  @ApiProperty({ description: 'Number of new profiles created', example: 120 })
  newProfiles: number;

  @ApiProperty({ description: 'Number of new applications submitted', example: 250 })
  newApplications: number;

  @ApiProperty({ description: 'Number of messages sent', example: 800 })
  messagesCount: number;
}

export class ApplicationTrendDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)', example: '2024-03-15' })
  date: string;

  @ApiProperty({ description: 'Number of applications submitted on this date', example: 15 })
  count: number;
}

export class ActivitySummaryDto {
  @ApiProperty({ description: 'Total active users (users with profiles)', example: 7500 })
  activeUsers: number;

  @ApiProperty({ description: 'Applications submitted this month', example: 450 })
  thisMonthApplications: number;

  @ApiProperty({ description: 'Applications submitted last month', example: 380 })
  lastMonthApplications: number;

  @ApiProperty({ description: 'Percentage change from last month', example: 18.4 })
  monthOverMonthGrowth: number;

  @ApiProperty({ description: 'Average applications per user', example: 1.8 })
  averageApplicationsPerUser: number;

  @ApiProperty({ description: 'Most popular intake season', example: 'FALL' })
  popularIntakeSeason: string;
}

export class DashboardStatsResponseDto {
  @ApiProperty({ description: 'Overall counts across all entities' })
  totalCounts: TotalCountsResponseDto;

  @ApiProperty({ description: 'Application statistics by status' })
  applicationStats: ApplicationStatusStatsDto;

  @ApiProperty({ description: 'Geographic distribution of students and universities' })
  geographicDistribution: GeographicDistributionDto[];

  @ApiProperty({ description: 'Most popular programs by application count' })
  popularPrograms: PopularProgramDto[];

  @ApiProperty({ description: 'Universities with highest application volumes' })
  topUniversities: UniversityStatsDto[];

  @ApiProperty({ description: 'Monthly growth statistics for the last 12 months' })
  growthStats: GrowthStatsDto[];

  @ApiProperty({ description: 'Activity summary and key metrics' })
  activitySummary: ActivitySummaryDto;
}

export class DetailedApplicationStatsDto {
  @ApiProperty({ description: 'Application statistics by status' })
  byStatus: ApplicationStatusStatsDto;

  @ApiProperty({ description: 'Applications grouped by country' })
  byCountry: Array<{
    countryCode: number;
    countryName: string;
    count: number;
  }>;

  @ApiProperty({ description: 'Applications grouped by intake season' })
  byIntakeSeason: Array<{
    season: string;
    count: number;
  }>;

  @ApiProperty({ description: 'Applications grouped by intake year' })
  byIntakeYear: Array<{
    year: number;
    count: number;
  }>;

  @ApiProperty({ description: 'Daily application trends for the last 30 days' })
  trends: ApplicationTrendDto[];
}

export class UserEngagementStatsDto {
  @ApiProperty({ description: 'Total registered users', example: 8500 })
  totalUsers: number;

  @ApiProperty({ description: 'Users with completed profiles', example: 7200 })
  usersWithProfiles: number;

  @ApiProperty({ description: 'Users who have submitted applications', example: 5000 })
  usersWithApplications: number;

  @ApiProperty({ description: 'Average messages per user', example: 3.2 })
  averageMessagesPerUser: number;

  @ApiProperty({ description: 'Profile completion rate percentage', example: 84.7 })
  profileCompletionRate: number;

  @ApiProperty({ description: 'Application conversion rate percentage', example: 69.4 })
  applicationConversionRate: number;
}