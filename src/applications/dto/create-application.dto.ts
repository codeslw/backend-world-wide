import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsUrl,
  MinLength,
} from 'class-validator';
import { Gender, LanguageTest, IntakeSeason, ApplicationStatus } from '@prisma/client';

export class CreateApplicationDto {
  // Personal Information
  @ApiProperty({ required: false, description: 'Middle name of the applicant' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ required: true, description: 'Date of birth in ISO format' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    enum: Gender,
    required: false,
    description: 'Gender of the applicant',
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ required: true, description: 'Nationality of the applicant' })
  @IsString()
  nationality: string;

  @ApiProperty({ required: true, description: 'Full address of the applicant' })
  @IsString()
  address: string;

  // Passport Information
  @ApiProperty({ required: true, description: 'Passport number' })
  @IsString()
  passportNumber: string;

  @ApiProperty({
    required: true,
    description: 'Passport expiry date in ISO format',
  })
  @IsDateString()
  passportExpiryDate: string;

  @ApiProperty({
    required: true,
    description: 'URL to the uploaded passport copy',
  })
  @IsString()
  @IsUrl()
  passportCopyUrl: string;

  // Education Information
  @ApiProperty({
    required: true,
    description: 'Current education level (e.g., "Bachelor", "High School")',
  })
  @IsString()
  currentEducationLevel: string;

  @ApiProperty({
    required: false,
    description: 'Name of current educational institution',
  })
  @IsOptional()
  @IsString()
  currentInstitutionName?: string;

  @ApiProperty({ required: false, description: 'Year of graduation' })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2100)
  graduationYear?: number;

  @ApiProperty({
    required: false,
    description: 'URL to the uploaded transcript',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  transcriptUrl?: string;

  // Language Proficiency
  @ApiProperty({
    enum: LanguageTest,
    required: false,
    description: 'Type of language test taken',
  })
  @IsOptional()
  @IsEnum(LanguageTest)
  languageTest?: LanguageTest;

  @ApiProperty({ required: false, description: 'Score of language test' })
  @IsOptional()
  @IsString()
  languageScore?: string;

  @ApiProperty({
    required: false,
    description: 'URL to the uploaded language certificate',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  languageCertificateUrl?: string;

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

  // Additional Documents
  @ApiProperty({
    required: false,
    description: 'URL to the uploaded motivation letter',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  motivationLetterUrl?: string;

  @ApiProperty({
    required: false,
    description: 'URLs to the uploaded recommendation letters',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  recommendationLetterUrls?: string[];

  @ApiProperty({ required: false, description: 'URL to the uploaded CV' })
  @IsOptional()
  @IsString()
  @IsUrl()
  cvUrl?: string;

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
