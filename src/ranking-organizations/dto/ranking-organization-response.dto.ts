import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RankingOrganizationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  descriptionUz?: string | null;

  @ApiPropertyOptional()
  descriptionRu?: string | null;

  @ApiPropertyOptional()
  descriptionEn?: string | null;

  @ApiPropertyOptional()
  imageUrl?: string | null;

  @ApiPropertyOptional()
  establishedYear?: number | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
