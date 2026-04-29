import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Full name of the reviewer' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: 'Phone number (optional)' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Review content (optional)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'YouTube video URL (optional)' })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;
}
