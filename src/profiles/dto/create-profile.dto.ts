import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsDateString,
  IsEnum,
  IsUrl,
  IsArray,
} from 'class-validator';
import { Gender, LanguageTest } from '@prisma/client';

export class CreateProfileDto {
  @ApiProperty({ description: 'First name of the user', example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name of the user', example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Middle name of the user',
    example: 'Michael',
    required: false,
  })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({
    description: 'Date of birth in ISO format',
    example: '1990-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    enum: Gender,
    description: 'Gender of the user',
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    description: 'Nationality of the user',
    example: 'American',
    required: false,
  })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiProperty({
    description: 'Full address of the user',
    example: '123 Main St, Anytown, USA',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Passport number',
    example: 'X12345678',
    required: false,
  })
  // @IsOptional()
  // @IsString()
  // passportNumber?: string;

  @ApiProperty({
    description: 'Passport expiry date in ISO format',
    example: '2030-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  passportExpiryDate?: string;

  @ApiProperty({
    description: 'URL to the uploaded passport copy',
    example: 'https://example.com/passport.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  passportCopyUrl?: string;

  @ApiProperty({ description: 'Year of birth', example: 1990, required: false })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  yearOfBirth?: number;

  @ApiProperty({
    description: 'Passport series and number',
    example: 'AB1234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  passportSeriesAndNumber?: string;

  @ApiProperty({
    description: 'Alternative email address',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Current education level',
    example: 'Bachelor',
    required: false,
  })
  @IsOptional()
  @IsString()
  currentEducationLevel?: string;

  @ApiProperty({
    description: 'Current educational institution name',
    example: 'University of Example',
    required: false,
  })
  @IsOptional()
  @IsString()
  currentInstitutionName?: string;

  @ApiProperty({
    description: 'Graduation year',
    example: 2022,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 10)
  graduationYear?: number;

  @ApiProperty({
    description: 'URL to uploaded transcript document',
    example: 'https://example.com/transcript.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  transcriptUrl?: string;

  @ApiProperty({
    enum: LanguageTest,
    description: 'Language test type',
    required: false,
  })
  @IsOptional()
  @IsEnum(LanguageTest)
  languageTest?: LanguageTest;

  @ApiProperty({
    description: 'Language test score',
    example: '7.5',
    required: false,
  })
  @IsOptional()
  @IsString()
  languageScore?: string;

  @ApiProperty({
    description: 'URL to uploaded language certificate',
    example: 'https://example.com/certificate.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  languageCertificateUrl?: string;

  @ApiProperty({
    description: 'URL to uploaded motivation letter',
    example: 'https://example.com/motivation.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  motivationLetterUrl?: string;

  @ApiProperty({
    description: 'URLs to uploaded recommendation letters',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  recommendationLetterUrls?: string[];

  @ApiProperty({
    description: 'URL to uploaded CV',
    example: 'https://example.com/cv.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  cvUrl?: string;
}
