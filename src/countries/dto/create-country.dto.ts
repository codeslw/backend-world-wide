import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsBoolean,
  IsOptional,
  IsUrl,
  ValidateIf,
  IsArray,
} from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ description: 'Country code' })
  @IsNumber()
  @Min(1)
  @Max(999)
  code: number;

  @ApiProperty({ description: 'Country name in Uzbek' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameUz: string;

  @ApiProperty({ description: 'Country name in Russian' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameRu: string;

  @ApiProperty({ description: 'Country name in English' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameEn: string;

  @ApiPropertyOptional({
    description: 'Whether this country is featured as main (only 3 allowed)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @ApiPropertyOptional({
    description: 'Photo URL for the country (required when isMain is true)',
    example: 'https://example.com/country.jpg',
  })
  @IsOptional()
  @ValidateIf((o) => o.isMain === true)
  @IsUrl()
  photoUrl?: string;

  // General Info
  @ApiPropertyOptional({ description: 'Overview in English' })
  @IsOptional()
  @IsString()
  overviewEn?: string;

  @ApiPropertyOptional({ description: 'Overview in Russian' })
  @IsOptional()
  @IsString()
  overviewRu?: string;

  @ApiPropertyOptional({ description: 'Overview in Uzbek' })
  @IsOptional()
  @IsString()
  overviewUz?: string;

  @ApiPropertyOptional({ description: 'Array of image URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  // Financial Requirements
  @ApiPropertyOptional({
    description: 'Proof of funds amount required',
    example: '€11,208/year',
  })
  @IsOptional()
  @IsString()
  proofOfFundsAmount?: string;

  @ApiPropertyOptional({ description: 'Minimum tuition fee' })
  @IsOptional()
  @IsNumber()
  tuitionMin?: number;

  @ApiPropertyOptional({ description: 'Maximum tuition fee' })
  @IsOptional()
  @IsNumber()
  tuitionMax?: number;

  @ApiPropertyOptional({ description: 'Tuition currency', example: 'USD' })
  @IsOptional()
  @IsString()
  tuitionCurrency?: string;

  @ApiPropertyOptional({ description: 'Minimum cost of living' })
  @IsOptional()
  @IsNumber()
  costOfLivingMin?: number;

  @ApiPropertyOptional({ description: 'Maximum cost of living' })
  @IsOptional()
  @IsNumber()
  costOfLivingMax?: number;

  @ApiPropertyOptional({
    description: 'Cost of living currency',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  costOfLivingCurrency?: string;

  @ApiPropertyOptional({ description: 'Scholarship availability information' })
  @IsOptional()
  @IsString()
  scholarshipAvailability?: string;

  // Visa & Immigration
  @ApiPropertyOptional({
    description: 'Visa acceptance rate',
    example: 'High',
  })
  @IsOptional()
  @IsString()
  visaAcceptanceRate?: string;

  @ApiPropertyOptional({
    description: 'Visa processing time',
    example: '2-4 weeks',
  })
  @IsOptional()
  @IsString()
  visaProcessingTime?: string;

  @ApiPropertyOptional({
    description: 'Whether visa interview is required',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  visaInterviewRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Whether dependent visa is available',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dependentVisaAvailable?: boolean;

  // Work Rights
  @ApiPropertyOptional({
    description: 'Part-time work hours allowed',
    example: '20 hours/week',
  })
  @IsOptional()
  @IsString()
  partTimeWorkHours?: string;

  @ApiPropertyOptional({
    description: 'Post-study work duration',
    example: '2 years',
  })
  @IsOptional()
  @IsString()
  postStudyWorkDuration?: string;

  @ApiPropertyOptional({
    description: 'Whether PR pathway is available',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  prPathwayAvailable?: boolean;

  // Academic & Logistical
  @ApiPropertyOptional({
    description: 'Major intake periods',
    type: [String],
    example: ['September', 'January'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  majorIntakes?: string[];

  @ApiPropertyOptional({
    description: 'Application timeline information',
    example: 'Apply 6 months in advance',
  })
  @IsOptional()
  @IsString()
  applicationTimeline?: string;

  @ApiPropertyOptional({
    description: 'Accepted language tests',
    type: [String],
    example: ['IELTS', 'TOEFL'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acceptedLanguageTests?: string[];

  @ApiPropertyOptional({
    description: 'Standardized tests required',
    example: 'GMAT for MBA',
  })
  @IsOptional()
  @IsString()
  standardizedTestsRequired?: string;

  @ApiPropertyOptional({
    description: 'Gap acceptance policy',
    example: 'Up to 5 years',
  })
  @IsOptional()
  @IsString()
  gapAcceptance?: string;

  // Life & Experience
  @ApiPropertyOptional({
    description: 'Types of accommodation available',
    type: [String],
    example: ['On-campus', 'Private', 'Homestay'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accommodationTypes?: string[];

  @ApiPropertyOptional({ description: 'Minimum average rent' })
  @IsOptional()
  @IsNumber()
  averageRentMin?: number;

  @ApiPropertyOptional({ description: 'Maximum average rent' })
  @IsOptional()
  @IsNumber()
  averageRentMax?: number;

  @ApiPropertyOptional({ description: 'Rent currency', example: 'USD' })
  @IsOptional()
  @IsString()
  rentCurrency?: string;

  @ApiPropertyOptional({
    description: 'Safety index information',
    example: 'High',
  })
  @IsOptional()
  @IsString()
  safetyIndex?: string;

  @ApiPropertyOptional({ description: 'Healthcare system details' })
  @IsOptional()
  @IsString()
  healthcareDetails?: string;

  @ApiPropertyOptional({
    description: 'International student population',
    example: '~500,000',
  })
  @IsOptional()
  @IsString()
  internationalStudentPopulation?: string;

  @ApiPropertyOptional({
    description: 'Whether halal food is available',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasHalalFood?: boolean;

  @ApiPropertyOptional({
    description: 'Whether vegetarian food is available',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasVegetarianFood?: boolean;
}
