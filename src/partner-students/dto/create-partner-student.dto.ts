import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaritalStatus, Gender } from '@prisma/client';

export class CreatePartnerStudentDto {
  // 1.1 Personal Information
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

  @ApiProperty({ example: '2000-01-01' })
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstLanguage?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  countryOfCitizenship: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  passportNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  passportPlaceOfBirth?: string;

  @ApiProperty({ example: '2030-01-01' })
  @IsDateString()
  passportExpiryDate: string;

  @ApiProperty({ enum: MaritalStatus })
  @IsEnum(MaritalStatus)
  maritalStatus: MaritalStatus;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  // 1.2 Address
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  streetAddress: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  provinceState: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  postalZipCode?: string;

  // 2.1 Education details
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  countryOfEducation: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  highestLevelOfEducation: string;

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
  @IsBoolean()
  @IsOptional()
  graduated?: boolean;

  @ApiPropertyOptional({ description: 'Array of school objects' })
  @IsOptional()
  schools?: any;

  // 3.1 & 3.2 Certificates & Test Scores
  @ApiPropertyOptional({ description: 'Array of { name, url, type? }' })
  @IsOptional()
  certificates?: any;

  @ApiPropertyOptional({ description: 'Object with test type keys and score/date values' })
  @IsOptional()
  testScores?: any;

  // 4. Additional details
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
