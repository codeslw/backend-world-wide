import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaritalStatus, Gender } from '@prisma/client';

export class CreatePartnerStudentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fatherFullName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  motherFullName?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstLanguage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  countryOfCitizenship?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  passportNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  passportPlaceOfBirth?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  passportExpiryDate?: string;

  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsEnum(MaritalStatus)
  @IsOptional()
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  streetAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  provinceState?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  postalZipCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  countryOfEducation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  highestLevelOfEducation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  previousEducationLevel?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  desiredEducationLevel?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gradingScheme?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gradeScaleOutOf?: string;

  @ApiPropertyOptional()
  @IsOptional()
  gradeAverage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  graduated?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  schools?: any;

  @ApiPropertyOptional()
  @IsOptional()
  certificates?: any;

  @ApiPropertyOptional()
  @IsOptional()
  testScores?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  leadSource?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studentAgent?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studentStage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyRelation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  financialSupport?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  howHeard?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  additionalNotes?: string;
}
