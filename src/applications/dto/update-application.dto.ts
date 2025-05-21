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

export class UpdateApplicationDto {
  // Fields moved to Profile DTO
  // All personal information, passport information, education, language proficiency and document fields
  // have been moved to Profile entity

  // University Preferences
  @ApiProperty({ required: false, description: 'Preferred country for study' })
  @IsOptional()
  @IsString()
  preferredCountry?: string;

  @ApiProperty({
    required: false,
    description: 'Preferred university for study',
  })
  @IsOptional()
  @IsString()
  preferredUniversity?: string;

  @ApiProperty({ required: false, description: 'Preferred program of study' })
  @IsOptional()
  @IsString()
  preferredProgram?: string;

  @ApiProperty({
    enum: IntakeSeason,
    required: false,
    description: 'Preferred intake season',
  })
  @IsOptional()
  @IsEnum(IntakeSeason)
  intakeSeason?: IntakeSeason;

  @ApiProperty({ required: false, description: 'Year of intended intake' })
  @IsOptional()
  @IsNumber()
  @Min(new Date().getFullYear())
  @Max(new Date().getFullYear() + 5)
  intakeYear?: number;

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
