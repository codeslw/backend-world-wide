import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateFounderDto {
  @ApiProperty({ description: 'Founder full name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Role/title (Uzbek)' })
  @IsOptional()
  @IsString()
  roleUz?: string;

  @ApiPropertyOptional({ description: 'Role/title (Russian)' })
  @IsOptional()
  @IsString()
  roleRu?: string;

  @ApiPropertyOptional({ description: 'Role/title (English)' })
  @IsOptional()
  @IsString()
  roleEn?: string;

  @ApiPropertyOptional({ description: 'Biography / story (Uzbek, HTML allowed)' })
  @IsOptional()
  @IsString()
  bioUz?: string;

  @ApiPropertyOptional({ description: 'Biography / story (Russian, HTML allowed)' })
  @IsOptional()
  @IsString()
  bioRu?: string;

  @ApiPropertyOptional({ description: 'Biography / story (English, HTML allowed)' })
  @IsOptional()
  @IsString()
  bioEn?: string;

  @ApiPropertyOptional({ description: 'Photo URL or storage key' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'LinkedIn profile URL' })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiPropertyOptional({ description: 'Manual ordering' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
