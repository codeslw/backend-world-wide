import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateAboutPageDto {
  // Hero
  @ApiPropertyOptional() @IsOptional() @IsString() heroTitleUz?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() heroTitleRu?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() heroTitleEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() heroSubtitleUz?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() heroSubtitleRu?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() heroSubtitleEn?: string;
  @ApiPropertyOptional({ description: 'Hero image URL or storage key' })
  @IsOptional()
  @IsString()
  heroImageUrl?: string;

  // Intro
  @ApiPropertyOptional() @IsOptional() @IsString() introHeadingUz?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() introHeadingRu?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() introHeadingEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() introBodyUz?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() introBodyRu?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() introBodyEn?: string;

  // Operator statement
  @ApiPropertyOptional() @IsOptional() @IsString() operatorStatementUz?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() operatorStatementRu?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() operatorStatementEn?: string;

  // History stats
  @ApiPropertyOptional({ description: 'Year the company was founded' })
  @IsOptional()
  @IsInt()
  foundedYear?: number;

  @ApiPropertyOptional({ description: 'Platform launch label, e.g. "2026-01"' })
  @IsOptional()
  @IsString()
  platformLaunch?: string;

  // Section headings
  @ApiPropertyOptional() @IsOptional() @IsString() founderHeadingUz?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() founderHeadingRu?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() founderHeadingEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() milestonesHeadingUz?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() milestonesHeadingRu?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() milestonesHeadingEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() teamHeadingUz?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() teamHeadingRu?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() teamHeadingEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() certificatesHeadingUz?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() certificatesHeadingRu?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() certificatesHeadingEn?: string;
}
