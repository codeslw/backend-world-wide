import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum TimePeriod {
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_3_MONTHS = 'last_3_months',
  LAST_6_MONTHS = 'last_6_months',
  LAST_YEAR = 'last_year',
  ALL_TIME = 'all_time'
}

export enum GroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

export class StatisticsQueryDto {
  @ApiPropertyOptional({
    description: 'Time period for filtering data',
    enum: TimePeriod,
    example: TimePeriod.LAST_30_DAYS
  })
  @IsOptional()
  @IsEnum(TimePeriod)
  period?: TimePeriod;

  @ApiPropertyOptional({
    description: 'Start date for custom period (YYYY-MM-DD)',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for custom period (YYYY-MM-DD)',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Group results by time period',
    enum: GroupBy,
    example: GroupBy.MONTH
  })
  @IsOptional()
  @IsEnum(GroupBy)
  groupBy?: GroupBy;

  @ApiPropertyOptional({
    description: 'Filter by specific country code',
    example: 860
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  countryCode?: number;

  @ApiPropertyOptional({
    description: 'Filter by specific university ID',
    example: 'uni123-abc456'
  })
  @IsOptional()
  @IsString()
  universityId?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific program ID',
    example: 'prog123-abc456'
  })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({
    description: 'Limit number of results',
    example: 10,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class TrendQueryDto {
  @ApiPropertyOptional({
    description: 'Number of days to include in trend analysis',
    example: 30,
    minimum: 7,
    maximum: 365
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(365)
  days?: number;

  @ApiPropertyOptional({
    description: 'Group trend data by period',
    enum: GroupBy,
    example: GroupBy.DAY
  })
  @IsOptional()
  @IsEnum(GroupBy)
  groupBy?: GroupBy;
}