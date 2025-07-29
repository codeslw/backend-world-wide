import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsObject,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { DegreeType } from '@prisma/client';

export class UniversityRequirementsDto {
  @ApiPropertyOptional({
    description: 'Minimum IELTS score required',
    example: 6.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9)
  minIeltsScore?: number;

  @ApiPropertyOptional({
    description: 'Minimum TOEFL score required',
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  minToeflScore?: number;

  @ApiPropertyOptional({
    description: 'Minimum Duolingo score required',
    example: 110,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(160)
  minDuolingoScore?: number;

  @ApiPropertyOptional({
    enum: DegreeType,
    description: 'The minimum degree required for admission',
  })
  @IsOptional()
  @IsEnum(DegreeType)
  requiredDegree?: DegreeType;

  @ApiPropertyOptional({
    description: 'Minimum GPA required',
    example: 3.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  minGpa?: number;

  @ApiPropertyOptional({
    description: 'Minimum GMAT score required',
    example: 700,
  })
  @IsOptional()
  @IsInt()
  @Min(200)
  @Max(800)
  minGmatScore?: number;

  @ApiPropertyOptional({
    description: 'Minimum CAT score required',
    example: 90,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minCatScore?: number;

  @ApiPropertyOptional({
    description: 'Number of recommendation letters required',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  requiredRecommendationLetters?: number;

  @ApiPropertyOptional({
    description: 'Other miscellaneous requirements in JSON format',
    example: { 'essay_required': true, 'interview': 'recommended' },
  })
  @IsOptional()
  @IsObject()
  otherRequirements?: any;
}
