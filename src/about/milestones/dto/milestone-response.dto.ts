import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MilestoneResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  year: string;

  @ApiPropertyOptional()
  titleUz?: string | null;

  @ApiPropertyOptional()
  titleRu?: string | null;

  @ApiPropertyOptional()
  titleEn?: string | null;

  @ApiPropertyOptional()
  descriptionUz?: string | null;

  @ApiPropertyOptional()
  descriptionRu?: string | null;

  @ApiPropertyOptional()
  descriptionEn?: string | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
