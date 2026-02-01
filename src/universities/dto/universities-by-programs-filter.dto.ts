import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsNumber,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StudyLevel } from '../../common/enum/study-level.enum';
import { Currency } from '../../common/enum/currency.enum';

export class UniversitiesByProgramsFilterDto {
  @ApiProperty({ description: 'Country code', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  countryCode?: number;

  @ApiProperty({ description: 'City ID', required: false })
  @IsOptional()
  @IsUUID('4')
  cityId?: string;

  @ApiProperty({ description: 'Minimum tuition fee', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minTuitionFee?: number;

  @ApiProperty({ description: 'Maximum tuition fee', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxTuitionFee?: number;

  @ApiProperty({
    description: 'Tuition fee currency',
    required: false,
    enum: Currency,
  })
  @IsOptional()
  @IsEnum(Currency)
  tuitionFeeCurrency?: Currency;

  @ApiProperty({
    description: 'Study level',
    required: false,
    enum: StudyLevel,
  })
  @IsOptional()
  @IsEnum(StudyLevel)
  studyLevel?: StudyLevel;

  @ApiProperty({
    description: 'Filter by intake ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  intake?: string;

  @ApiProperty({
    description: 'Filter by university ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  universityId?: string;

  @ApiProperty({ description: 'Minimum university ranking', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minRanking?: number;

  @ApiProperty({ description: 'Maximum university ranking', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxRanking?: number;

  @ApiProperty({ description: 'Search query', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Field to sort by', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    description: 'Sort direction',
    required: false,
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortDirection?: 'asc' | 'desc';

  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
