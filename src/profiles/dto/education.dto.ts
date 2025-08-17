import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
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

  @ApiPropertyOptional({ description: 'File GUID for the transcript document' })
  @IsOptional()
  @IsUUID()
  transcriptGuid?: string;

  @ApiPropertyOptional({ description: 'File GUID for the diploma document' })
  @IsOptional()
  @IsUUID()
  diplomaGuid?: string;
}
