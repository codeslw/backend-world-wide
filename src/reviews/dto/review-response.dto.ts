import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewTypeDto } from './create-review.dto';

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ReviewTypeDto })
  type: ReviewTypeDto;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  phoneNumber?: string | null;

  @ApiProperty({ minimum: 1, maximum: 5 })
  rating: number;

  @ApiPropertyOptional()
  content?: string | null;

  @ApiPropertyOptional()
  videoUrl?: string | null;

  @ApiPropertyOptional()
  imageUrl?: string | null;

  @ApiPropertyOptional()
  country?: string | null;

  @ApiPropertyOptional()
  destinationCountry?: string | null;

  @ApiPropertyOptional()
  degree?: string | null;

  @ApiPropertyOptional()
  university?: string | null;

  @ApiPropertyOptional()
  ranking?: string | null;

  @ApiPropertyOptional()
  scholarshipAmount?: string | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  showOnHomepage: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
