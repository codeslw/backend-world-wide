import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { UniversityType } from '../../common/enum/university-type.enum';

export class UniversityFilterDto {
  @ApiProperty({ description: 'Search query', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Country code', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  countryCode?: number;

  @ApiProperty({ description: 'City ID', required: false })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiProperty({
    description: 'University type',
    required: false,
    enum: UniversityType,
  })
  @IsOptional()
  @IsEnum(UniversityType)
  type?: string;

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

  @ApiProperty({ description: 'Minimum establishment year', required: false })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Type(() => Number)
  minEstablished?: number;

  @ApiProperty({ description: 'Maximum establishment year', required: false })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Type(() => Number)
  maxEstablished?: number;

  @ApiProperty({
    description: 'Minimum acceptance rate (percentage)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  minAcceptanceRate?: number;

  @ApiProperty({
    description: 'Maximum acceptance rate (percentage)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  maxAcceptanceRate?: number;

  @ApiProperty({ description: 'Minimum application fee', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minApplicationFee?: number;

  @ApiProperty({ description: 'Maximum application fee', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxApplicationFee?: number;

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

  @ApiProperty({
    description: 'Filter by program IDs',
    required: false,
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').filter((id) => id);
    }
    return value;
  })
  @IsArray()
  @IsUUID('4', { each: true })
  programs?: string[];

  @ApiProperty({ description: 'Page number', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;
}
