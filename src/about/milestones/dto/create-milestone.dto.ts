import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateMilestoneDto {
  @ApiProperty({
    description: 'Year/date label, free-form (e.g. "2020", "Jan 2026")',
  })
  @IsString()
  year: string;

  @ApiPropertyOptional({ description: 'Title (Uzbek)' })
  @IsOptional()
  @IsString()
  titleUz?: string;

  @ApiPropertyOptional({ description: 'Title (Russian)' })
  @IsOptional()
  @IsString()
  titleRu?: string;

  @ApiPropertyOptional({ description: 'Title (English)' })
  @IsOptional()
  @IsString()
  titleEn?: string;

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

  @ApiPropertyOptional({ description: 'Manual ordering' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
