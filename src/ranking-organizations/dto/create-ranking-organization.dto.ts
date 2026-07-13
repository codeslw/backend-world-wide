import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRankingOrganizationDto {
  @ApiProperty({ description: 'Ranking organization name (non-localized)' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Description (Uzbek)' })
  @IsOptional()
  @IsString()
  descriptionUz?: string;

  @ApiPropertyOptional({ description: 'Description (Russian)' })
  @IsOptional()
  @IsString()
  descriptionRu?: string;

  @ApiPropertyOptional({ description: 'Description (English)' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Icon/logo image URL or storage key' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Year the ranking organization was established',
  })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(3000)
  establishedYear?: number;

  @ApiPropertyOptional({ description: 'Manual ordering' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
