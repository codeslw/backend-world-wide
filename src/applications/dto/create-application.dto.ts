import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { IntakeSeason, ApplicationStatus } from '@prisma/client';

export class CreateApplicationDto {
  // Fields moved to Profile DTO
  // All personal information, passport information, education, language proficiency and document fields
  // have been moved to Profile entity

  // University Preferences
  @ApiProperty({ required: true, description: 'Preferred country for study' })
  @IsString()
  preferredCountry: string;

  @ApiProperty({
    required: true,
    description: 'Preferred university for study',
  })
  @IsString()
  preferredUniversity: string;

  @ApiProperty({ required: true, description: 'Preferred program of study' })
  @IsString()
  preferredProgram: string;

  @ApiProperty({
    enum: IntakeSeason,
    required: true,
    description: 'Preferred intake season',
  })
  @IsEnum(IntakeSeason)
  intakeSeason: IntakeSeason;

  @ApiProperty({ required: true, description: 'Year of intended intake' })
  @IsNumber()
  @Min(new Date().getFullYear())
  @Max(new Date().getFullYear() + 5)
  intakeYear: number;

  // Meta
  @ApiProperty({
    enum: ApplicationStatus,
    required: false,
    description: 'Status of the application',
  })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  applicationStatus?: ApplicationStatus;

  @ApiProperty({
    required: false,
    description: 'Submission date in ISO format',
  })
  @IsOptional()
  @IsDateString()
  submittedAt?: string;
}
