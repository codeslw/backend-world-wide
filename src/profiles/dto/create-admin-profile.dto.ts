import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  IsArray,
  IsUUID,
  MinLength,
  MaxLength,
  IsEmail,
  IsPhoneNumber,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { Type } from 'class-transformer';
import { EducationDto } from './education.dto';
import { LanguageCertificateDto } from './language-certificate.dto';
import { StandardizedTestDto } from './standardized-test.dto';

export class CreateAdminProfileDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({
    example: '1990-01-01T00:00:00.000Z',
    description: 'Date of birth (ISO-8601 format)',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Michael', description: 'Middle name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @ApiPropertyOptional({ enum: Gender, description: 'Gender' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 'American', description: 'Nationality' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationality?: string;

  @ApiPropertyOptional({
    example: '123 Main St, Anytown, USA',
    description: 'Address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    example: 'AB1234567',
    description: 'Passport series and number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  passportSeriesAndNumber?: string;

  @ApiPropertyOptional({
    example: '2030-01-01T00:00:00.000Z',
    description: 'Passport expiry date (ISO-8601 format)',
  })
  @IsOptional()
  @IsDateString()
  passportExpiryDate?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'File GUID for passport copy',
  })
  @IsOptional()
  @IsUUID()
  passportCopyGuid?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'File GUID for motivation letter',
  })
  @IsOptional()
  @IsUUID()
  motivationLetterGuid?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'],
    description: 'File GUIDs for recommendation letters',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  recommendationLetterGuids?: string[];

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440004',
    description: 'File GUID for CV',
  })
  @IsOptional()
  @IsUUID()
  cvGuid?: string;

  // @ApiPropertyOptional({ example: 1990, description: 'Year of birth' })
  // @IsOptional()
  // @IsInt()
  // yearOfBirth?: number;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Contact email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({
    type: () => [EducationDto],
    description: 'List of educational qualifications',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  educationHistory?: EducationDto[];

  @ApiPropertyOptional({
    type: () => [LanguageCertificateDto],
    description: 'List of language certificates',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageCertificateDto)
  languageCertificates?: LanguageCertificateDto[];

  @ApiPropertyOptional({
    type: () => [StandardizedTestDto],
    description: 'List of standardized test scores',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StandardizedTestDto)
  standardizedTests?: StandardizedTestDto[];
}
