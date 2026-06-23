import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CertificateResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  titleUz?: string | null;

  @ApiPropertyOptional()
  titleRu?: string | null;

  @ApiPropertyOptional()
  titleEn?: string | null;

  @ApiPropertyOptional()
  issuerUz?: string | null;

  @ApiPropertyOptional()
  issuerRu?: string | null;

  @ApiPropertyOptional()
  issuerEn?: string | null;

  @ApiPropertyOptional()
  imageUrl?: string | null;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
