import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TeamMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  positionUz?: string | null;

  @ApiPropertyOptional()
  positionRu?: string | null;

  @ApiPropertyOptional()
  positionEn?: string | null;

  @ApiPropertyOptional()
  roleUz?: string | null;

  @ApiPropertyOptional()
  roleRu?: string | null;

  @ApiPropertyOptional()
  roleEn?: string | null;

  @ApiPropertyOptional()
  groupUz?: string | null;

  @ApiPropertyOptional()
  groupRu?: string | null;

  @ApiPropertyOptional()
  groupEn?: string | null;

  @ApiPropertyOptional()
  photoUrl?: string | null;

  @ApiPropertyOptional()
  linkedinUrl?: string | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
