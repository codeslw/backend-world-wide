import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCertificateDto {
  @ApiPropertyOptional({ description: 'Certificate title (Uzbek)' })
  @IsOptional()
  @IsString()
  titleUz?: string;

  @ApiPropertyOptional({ description: 'Certificate title (Russian)' })
  @IsOptional()
  @IsString()
  titleRu?: string;

  @ApiPropertyOptional({ description: 'Certificate title (English)' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({ description: 'Issuing organization (Uzbek)' })
  @IsOptional()
  @IsString()
  issuerUz?: string;

  @ApiPropertyOptional({ description: 'Issuing organization (Russian)' })
  @IsOptional()
  @IsString()
  issuerRu?: string;

  @ApiPropertyOptional({ description: 'Issuing organization (English)' })
  @IsOptional()
  @IsString()
  issuerEn?: string;

  @ApiPropertyOptional({ description: 'Certificate image URL or storage key' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether to feature this certificate prominently',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Manual ordering' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
