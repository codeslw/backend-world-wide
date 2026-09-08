import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateOurServiceDto {
  @ApiProperty({ example: 'document-translation' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Hujjatlarni tarjima qilish va apostil' })
  @IsString()
  @IsNotEmpty()
  titleUz: string;

  @ApiProperty({ example: 'Перевод документов и апостиль' })
  @IsString()
  @IsNotEmpty()
  titleRu: string;

  @ApiProperty({ example: 'Document translation and apostille' })
  @IsString()
  @IsNotEmpty()
  titleEn: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shortDescUz?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shortDescRu?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shortDescEn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fullDescUz?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fullDescRu?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fullDescEn?: string;

  @ApiPropertyOptional({ example: 'FileCheck' })
  @IsString()
  @IsOptional()
  iconName?: string;

  @ApiPropertyOptional({ example: 'Rasmiy' })
  @IsString()
  @IsOptional()
  badgeUz?: string;

  @ApiPropertyOptional({ example: 'Официально' })
  @IsString()
  @IsOptional()
  badgeRu?: string;

  @ApiPropertyOptional({ example: 'Official' })
  @IsString()
  @IsOptional()
  badgeEn?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  featuresUz?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  featuresRu?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  featuresEn?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  actionTextUz?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  actionTextRu?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  actionTextEn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}
