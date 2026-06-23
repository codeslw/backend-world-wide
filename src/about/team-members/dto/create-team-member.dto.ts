import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateTeamMemberDto {
  @ApiProperty({ description: 'Team member full name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Position (Uzbek)' })
  @IsOptional()
  @IsString()
  positionUz?: string;

  @ApiPropertyOptional({ description: 'Position (Russian)' })
  @IsOptional()
  @IsString()
  positionRu?: string;

  @ApiPropertyOptional({ description: 'Position (English)' })
  @IsOptional()
  @IsString()
  positionEn?: string;

  @ApiPropertyOptional({ description: 'Role / title tagline (Uzbek)' })
  @IsOptional()
  @IsString()
  roleUz?: string;

  @ApiPropertyOptional({ description: 'Role / title tagline (Russian)' })
  @IsOptional()
  @IsString()
  roleRu?: string;

  @ApiPropertyOptional({ description: 'Role / title tagline (English)' })
  @IsOptional()
  @IsString()
  roleEn?: string;

  @ApiPropertyOptional({ description: 'Department/group label (Uzbek)' })
  @IsOptional()
  @IsString()
  groupUz?: string;

  @ApiPropertyOptional({ description: 'Department/group label (Russian)' })
  @IsOptional()
  @IsString()
  groupRu?: string;

  @ApiPropertyOptional({ description: 'Department/group label (English)' })
  @IsOptional()
  @IsString()
  groupEn?: string;

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
