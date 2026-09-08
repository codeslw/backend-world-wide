import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOurServicesPageDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  heroTitleUz?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  heroTitleRu?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  heroTitleEn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  heroSubtitleUz?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  heroSubtitleRu?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  heroSubtitleEn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bannerTitleUz?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bannerTitleRu?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bannerTitleEn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bannerSubtitleUz?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bannerSubtitleRu?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bannerSubtitleEn?: string;
}
