import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { DegreeType } from '@prisma/client';

export class EducationDto {
  @ApiProperty({ enum: DegreeType, description: 'Type of degree' })
  @IsEnum(DegreeType)
  @IsNotEmpty()
  degree: DegreeType;

  @ApiProperty({ description: 'Name of the educational institution' })
  @IsString()
  @IsNotEmpty()
  institution: string;

  @ApiProperty({ description: 'Year of graduation' })
  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear() + 5)
  graduationYear: number;

  @ApiPropertyOptional({ description: 'Grade Point Average (GPA)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  gpa?: number;

  @ApiPropertyOptional({ description: 'URL to the transcript document' })
  @IsOptional()
  @IsUrl()
  transcriptUrl?: string;

  @ApiPropertyOptional({ description: 'URL to the diploma document' })
  @IsOptional()
  @IsUrl()
  diplomaUrl?: string;
}
