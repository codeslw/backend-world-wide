import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateUniversityRankingDto {
  @ApiProperty({ description: 'Ranking organization id' })
  @IsString()
  rankingOrganizationId: string;

  @ApiProperty({ description: 'Rank position (e.g. 142)' })
  @IsInt()
  @Min(1)
  rank: number;

  @ApiPropertyOptional({ description: 'Optional score (e.g. 82.4)' })
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiPropertyOptional({
    description: 'Optional category/subject (e.g. "Computer Science")',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Ranking edition year (e.g. 2025)' })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(3000)
  year?: number;

  @ApiPropertyOptional({ description: 'Manual ordering' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
