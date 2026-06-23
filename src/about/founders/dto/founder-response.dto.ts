import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FounderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  roleUz?: string | null;

  @ApiPropertyOptional()
  roleRu?: string | null;

  @ApiPropertyOptional()
  roleEn?: string | null;

  @ApiPropertyOptional()
  bioUz?: string | null;

  @ApiPropertyOptional()
  bioRu?: string | null;

  @ApiPropertyOptional()
  bioEn?: string | null;

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
