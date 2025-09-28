import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import {
  DashboardStatsResponseDto,
  TotalCountsResponseDto,
  ApplicationStatusStatsDto,
  GeographicDistributionDto,
  PopularProgramDto,
  UniversityStatsDto,
  GrowthStatsDto,
  DetailedApplicationStatsDto,
  UserEngagementStatsDto,
  ApplicationTrendDto,
} from './dto/statistics-response.dto';
import { StatisticsQueryDto, TrendQueryDto } from './dto/statistics-query.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

/**
 * StatisticsController provides comprehensive analytics and statistics
 * across all modules of the EduWorldWide platform.
 * 
 * This controller aggregates data from:
 * - Universities and Programs
 * - Student Applications and Profiles  
 * - Geographic Distribution (Countries/Cities)
 * - User Engagement and Growth Metrics
 * - Communication (Messages)
 * 
 * All endpoints are restricted to ADMIN users for data security.
 * The controller follows the established patterns for error handling,
 * response formatting, and Swagger documentation.
 */
@ApiTags('statistics')
@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * Get comprehensive dashboard statistics
   * 
   * Frontend Usage:
   * - Main admin dashboard overview
   * - Real-time metrics display
   * - Executive summary reports
   * 
   * @param query Optional filters for date range and limits
   * @returns Complete dashboard statistics with all key metrics
   */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get comprehensive dashboard statistics',
    description: `
      Returns a complete overview of platform statistics including:
      - Total counts across all entities
      - Application status breakdown
      - Geographic distribution of students/universities
      - Most popular programs and universities
      - Growth trends over the last 12 months
      - Key activity metrics and ratios
      
      Perfect for admin dashboards and executive reporting.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    type: ErrorResponseDto,
  })
  async getDashboardStats(
    @Query() query?: StatisticsQueryDto,
  ): Promise<DashboardStatsResponseDto> {
    return this.statisticsService.getDashboardStats(query);
  }

  /**
   * Get total entity counts across the platform
   * 
   * Frontend Usage:
   * - Dashboard summary cards
   * - Quick overview widgets
   * - System health monitoring
   * 
   * @returns Total counts for all major entities
   */
  @Get('totals')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get total counts for all entities',
    description: `
      Returns the total count of:
      - Universities and Programs
      - Student Applications and Profiles
      - Countries and Cities
      - Messages exchanged
      
      Useful for dashboard overview cards and system monitoring.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Total counts retrieved successfully',
    type: TotalCountsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    type: ErrorResponseDto,
  })
  async getTotalCounts(): Promise<TotalCountsResponseDto> {
    return this.statisticsService.getTotalCounts();
  }

  /**
   * Get application statistics grouped by status
   * 
   * Frontend Usage:
   * - Application pipeline visualization
   * - Status distribution charts (pie/donut charts)
   * - Workflow monitoring dashboards
   * 
   * @param query Optional date filters
   * @returns Application counts for each status (DRAFT, SUBMITTED, etc.)
   */
  @Get('applications/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get application statistics by status',
    description: `
      Returns application counts grouped by status:
      - DRAFT: Applications in progress
      - SUBMITTED: Applications submitted for review
      - UNDER_REVIEW: Applications being processed
      - APPROVED: Accepted applications
      - REJECTED: Declined applications
      
      Supports date filtering for historical analysis.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Application status statistics retrieved successfully',
    type: ApplicationStatusStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    type: ErrorResponseDto,
  })
  async getApplicationStatusStats(
    @Query() query?: StatisticsQueryDto,
  ): Promise<ApplicationStatusStatsDto> {
    return this.statisticsService.getApplicationStatsByStatus(
      this.statisticsService['buildDateFilter'](query?.period, query?.startDate, query?.endDate)
    );
  }

  /**
   * Get detailed application statistics with multiple groupings
   * 
   * Frontend Usage:
   * - Comprehensive application analytics page
   * - Multi-dimensional analysis charts
   * - Application trends visualization
   * 
   * @param query Filters for date range and result limits
   * @returns Detailed application statistics grouped by various dimensions
   */
  @Get('applications/detailed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get detailed application statistics',
    description: `
      Returns comprehensive application analytics including:
      - Status breakdown
      - Geographic distribution by country
      - Seasonal patterns by intake season
      - Yearly trends by intake year
      - Daily application trends (last 30 days)
      
      Ideal for detailed reporting and trend analysis.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed application statistics retrieved successfully',
    type: DetailedApplicationStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    type: ErrorResponseDto,
  })
  async getDetailedApplicationStats(
    @Query() query?: StatisticsQueryDto,
  ): Promise<DetailedApplicationStatsDto> {
    return this.statisticsService.getDetailedApplicationStats(query);
  }

  /**
   * Get application trends over time
   * 
   * Frontend Usage:
   * - Line charts for trend visualization
   * - Time series analysis
   * - Application volume monitoring
   * 
   * @param query Parameters for trend analysis (days, grouping)
   * @returns Daily application counts for the specified period
   */
  @Get('applications/trends')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get application trends over time',
    description: `
      Returns daily application submission trends for analysis.
      Default shows last 30 days, configurable up to 365 days.
      
      Perfect for:
      - Trend line charts
      - Volume pattern analysis
      - Peak period identification
    `,
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to include (7-365)',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Application trends retrieved successfully',
    type: [ApplicationTrendDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    type: ErrorResponseDto,
  })
  async getApplicationTrends(
    @Query() query?: TrendQueryDto,
  ): Promise<ApplicationTrendDto[]> {
    return this.statisticsService.getApplicationTrends(query?.days || 30);
  }

  /**
   * Get geographic distribution of students and universities
   * 
   * Frontend Usage:
   * - World map visualizations
   * - Geographic heat maps
   * - Regional analysis dashboards
   * 
   * @param query Optional limit for number of countries
   * @returns Geographic distribution data by country
   */
  @Get('geographic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get geographic distribution statistics',
    description: `
      Returns geographic distribution data including:
      - University counts per country
      - Application volumes by region
      - Student distribution patterns
      
      Sorted by university count (descending).
      Perfect for world maps and regional analysis.
    `,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of countries to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Geographic distribution retrieved successfully',
    type: [GeographicDistributionDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    type: ErrorResponseDto,
  })
  async getGeographicDistribution(
    @Query() query?: StatisticsQueryDto,
  ): Promise<GeographicDistributionDto[]> {
    return this.statisticsService.getGeographicDistribution(query?.limit || 10);
  }

  /**
   * Get most popular programs by application count
   * 
   * Frontend Usage:
   * - Popular programs ranking lists
   * - Program demand analysis charts
   * - Market trend identification
   * 
   * @param query Optional limit for number of programs
   * @returns Most popular programs with application counts and fees
   */
  @Get('programs/popular')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get most popular programs by application volume',
    description: `
      Returns programs ranked by application count including:
      - Total applications received
      - Number of universities offering the program
      - Average tuition fees across universities
      
      Sorted by application count (descending).
      Useful for identifying market demand and trends.
    `,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of programs to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Popular programs retrieved successfully',
    type: [PopularProgramDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    type: ErrorResponseDto,
  })
  async getPopularPrograms(
    @Query() query?: StatisticsQueryDto,
  ): Promise<PopularProgramDto[]> {
    return this.statisticsService.getPopularPrograms(query?.limit || 10);
  }

  /**
   * Get universities with highest application volumes
   * 
   * Frontend Usage:
   * - University ranking displays
   * - Institution performance analysis
   * - Competitive analysis dashboards
   * 
   * @param query Optional limit for number of universities
   * @returns Top universities by application count with location info
   */
  @Get('universities/top')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get universities with highest application volumes',
    description: `
      Returns universities ranked by application count including:
      - Total applications received
      - Number of programs offered
      - Location (country and city)
      
      Sorted by application count (descending).
      Perfect for institutional performance analysis.
    `,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of universities to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Top universities retrieved successfully',
    type: [UniversityStatsDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    type: ErrorResponseDto,
  })
  async getTopUniversities(
    @Query() query?: StatisticsQueryDto,
  ): Promise<UniversityStatsDto[]> {
    return this.statisticsService.getTopUniversities(query?.limit || 10);
  }

  /**
   * Get growth statistics over time
   * 
   * Frontend Usage:
   * - Growth trend charts
   * - Monthly/yearly comparison graphs
   * - Business performance dashboards
   * 
   * @param query Optional number of months to include
   * @returns Monthly growth data for profiles, applications, and messages
   */
  @Get('growth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get platform growth statistics over time',
    description: `
      Returns monthly growth statistics for the last 12 months including:
      - New profiles created
      - New applications submitted
      - Messages exchanged
      
      Perfect for trend analysis and business growth tracking.
    `,
  })
  @ApiQuery({
    name: 'months',
    required: false,
    description: 'Number of months to include in the analysis',
    example: 12,
  })
  @ApiResponse({
    status: 200,
    description: 'Growth statistics retrieved successfully',
    type: [GrowthStatsDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    type: ErrorResponseDto,
  })
  async getGrowthStats(
    @Query('months') months?: number,
  ): Promise<GrowthStatsDto[]> {
    return this.statisticsService.getGrowthStats(months || 12);
  }

  /**
   * Get user engagement and conversion statistics
   * 
   * Frontend Usage:
   * - User funnel analysis
   * - Engagement rate dashboards
   * - Conversion optimization metrics
   * 
   * @returns User engagement metrics and conversion rates
   */
  @Get('engagement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user engagement and conversion statistics',
    description: `
      Returns user engagement metrics including:
      - Total registered users
      - Profile completion rates
      - Application conversion rates
      - Average messages per user
      
      Essential for understanding user behavior and platform effectiveness.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'User engagement statistics retrieved successfully',
    type: UserEngagementStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    type: ErrorResponseDto,
  })
  async getUserEngagementStats(): Promise<UserEngagementStatsDto> {
    return this.statisticsService.getUserEngagementStats();
  }
}

/* 
=================================================================
FUTURE STATISTICS ENDPOINTS - IMPLEMENTATION SUGGESTIONS
=================================================================

The following endpoints could be added to extend the statistics functionality:

1. FINANCIAL ANALYTICS
   - GET /statistics/financial/revenue
     * Total tuition fees collected
     * Revenue by university/program
     * Average application fees
     * Payment completion rates

2. ACCEPTANCE RATIO ANALYSIS  
   - GET /statistics/acceptance-rates
     * University acceptance rates
     * Program-specific acceptance rates
     * Acceptance rates by country/region
     * Trends over time

3. APPLICATION PROCESSING METRICS
   - GET /statistics/processing-time
     * Average time from submission to decision
     * Processing time by university
     * Bottleneck identification
     * SLA compliance rates

4. STUDENT DEMOGRAPHICS
   - GET /statistics/demographics
     * Age distribution of applicants
     * Gender distribution
     * Nationality breakdown
     * Educational background analysis

5. COMMUNICATION ANALYTICS
   - GET /statistics/communication
     * Response times for messages
     * Communication volume by user type
     * Support ticket resolution times
     * Chat engagement patterns

6. SEASONAL PATTERNS
   - GET /statistics/seasonal
     * Application seasonality patterns
     * Peak months identification
     * Intake season preferences
     * Geographic seasonal variations

7. PREDICTIVE ANALYTICS
   - GET /statistics/predictions
     * Application volume forecasting
     * University capacity planning
     * Student demand predictions
     * Market trend analysis

8. COMPARATIVE ANALYSIS
   - GET /statistics/compare
     * Year-over-year comparisons
     * University performance benchmarking
     * Program popularity changes
     * Regional growth comparisons

9. QUALITY METRICS
   - GET /statistics/quality
     * Application completion rates
     * Data quality scores
     * User satisfaction metrics
     * Platform reliability statistics

10. REAL-TIME METRICS
    - GET /statistics/realtime
      * Live application submissions
      * Active users online
      * Current system load
      * Real-time notifications

IMPLEMENTATION NOTES:
- Follow the same patterns established in this controller
- Add appropriate DTOs for each endpoint
- Use Prisma aggregation for performance
- Implement proper caching for expensive queries
- Add rate limiting for resource-intensive endpoints
- Consider data privacy implications for sensitive metrics
- Add filters for date ranges, universities, programs, etc.
- Implement data export functionality (CSV, Excel)
- Add automated report generation capabilities
- Consider implementing GraphQL for complex queries

FRONTEND INTEGRATION EXAMPLES:
- Dashboard widgets with real-time updates
- Interactive charts using Chart.js or D3.js
- Exportable reports in multiple formats
- Drill-down capabilities for detailed analysis
- Responsive design for mobile admin access
- Progressive loading for large datasets
*/