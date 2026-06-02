import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export enum ReviewTypeDto {
  STUDENT_SUCCESS_VISA = 'STUDENT_SUCCESS_VISA',
  STUDENT_TESTIMONIAL = 'STUDENT_TESTIMONIAL',
  UNIVERSITY_OFFER = 'UNIVERSITY_OFFER',
}

export class CreateReviewDto {
  @ApiPropertyOptional({
    enum: ReviewTypeDto,
    default: ReviewTypeDto.STUDENT_TESTIMONIAL,
    description: 'Result section/type',
  })
  @IsOptional()
  @IsEnum(ReviewTypeDto)
  type?: ReviewTypeDto;

  @ApiProperty({ description: 'Full name of the reviewer' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: 'Phone number (optional)' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Review content (optional)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'YouTube video URL (optional)' })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Student/result image URL (optional)' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Country for university offer result' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Student destination country' })
  @IsOptional()
  @IsString()
  destinationCountry?: string;

  @ApiPropertyOptional({ description: 'Degree or study level' })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiPropertyOptional({ description: 'University name' })
  @IsOptional()
  @IsString()
  university?: string;

  @ApiPropertyOptional({ description: 'University ranking text' })
  @IsOptional()
  @IsString()
  ranking?: string;

  @ApiPropertyOptional({ description: 'Scholarship amount text' })
  @IsOptional()
  @IsString()
  scholarshipAmount?: string;

  @ApiPropertyOptional({ description: 'Manual ordering inside the section' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
