import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsObject, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
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
  @IsOptional()
  certificates?: any;

  @ApiPropertyOptional()
  @IsOptional()
  testScores?: any;
}
