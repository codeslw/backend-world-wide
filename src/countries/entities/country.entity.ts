import { ApiProperty } from '@nestjs/swagger';
import { City } from '../../cities/entities/city.entity';

export class Country {
  @ApiProperty({ description: 'Country code (primary identifier)' })
  code: number;

  @ApiProperty({ description: 'Country name in Uzbek' })
  nameUz: string;

  @ApiProperty({ description: 'Country name in Russian' })
  nameRu: string;

  @ApiProperty({ description: 'Country name in English' })
  nameEn: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Cities in this country',
    type: [City],
    required: false,
  })
  cities?: City[];

  // General Info
  @ApiProperty({ description: 'Overview in English', required: false })
  overviewEn?: string;

  @ApiProperty({ description: 'Overview in Russian', required: false })
  overviewRu?: string;

  @ApiProperty({ description: 'Overview in Uzbek', required: false })
  overviewUz?: string;

  @ApiProperty({
    description: 'Country images',
    type: [String],
    required: false,
  })
  images: string[];

  // Financial
  @ApiProperty({
    description: 'Proof of funds amount description',
    required: false,
  })
  proofOfFundsAmount?: string;

  @ApiProperty({ description: 'Minimum tuition fee', required: false })
  tuitionMin?: number;

  @ApiProperty({ description: 'Maximum tuition fee', required: false })
  tuitionMax?: number;

  @ApiProperty({ description: 'Tuition fee currency', required: false })
  tuitionCurrency?: string;

  @ApiProperty({ description: 'Minimum cost of living', required: false })
  costOfLivingMin?: number;

  @ApiProperty({ description: 'Maximum cost of living', required: false })
  costOfLivingMax?: number;

  @ApiProperty({ description: 'Cost of living currency', required: false })
  costOfLivingCurrency?: string;

  @ApiProperty({
    description: 'Scholarship availability description',
    required: false,
  })
  scholarshipAvailability?: string;

  // Visa
  @ApiProperty({
    description: 'Visa acceptance rate (High/Low)',
    required: false,
  })
  visaAcceptanceRate?: string;

  @ApiProperty({ description: 'Visa processing time', required: false })
  visaProcessingTime?: string;

  @ApiProperty({ description: 'Is visa interview required?', required: false })
  visaInterviewRequired: boolean;

  @ApiProperty({
    description: 'Are dependent visas available?',
    required: false,
  })
  dependentVisaAvailable: boolean;

  // Work Rights
  @ApiProperty({ description: 'Part-time work hours allowed', required: false })
  partTimeWorkHours?: string;

  @ApiProperty({ description: 'Post-study work duration', required: false })
  postStudyWorkDuration?: string;

  @ApiProperty({ description: 'Is PR pathway available?', required: false })
  prPathwayAvailable: boolean;

  // Academic
  @ApiProperty({
    description: 'Major intakes',
    type: [String],
    required: false,
  })
  majorIntakes: string[];

  @ApiProperty({ description: 'Application timeline', required: false })
  applicationTimeline?: string;

  @ApiProperty({
    description: 'Accepted language tests',
    type: [String],
    required: false,
  })
  acceptedLanguageTests: string[];

  @ApiProperty({ description: 'Standardized tests required', required: false })
  standardizedTestsRequired?: string;

  @ApiProperty({ description: 'Gap acceptance policy', required: false })
  gapAcceptance?: string;

  // Life
  @ApiProperty({
    description: 'Accommodation types',
    type: [String],
    required: false,
  })
  accommodationTypes: string[];

  @ApiProperty({ description: 'Minimum average rent', required: false })
  averageRentMin?: number;

  @ApiProperty({ description: 'Maximum average rent', required: false })
  averageRentMax?: number;

  @ApiProperty({ description: 'Rent currency', required: false })
  rentCurrency?: string;

  @ApiProperty({ description: 'Safety index', required: false })
  safetyIndex?: string;

  @ApiProperty({ description: 'Healthcare details', required: false })
  healthcareDetails?: string;

  @ApiProperty({
    description: 'International student population',
    required: false,
  })
  internationalStudentPopulation?: string;

  @ApiProperty({ description: 'Has Halal food options?', required: false })
  hasHalalFood: boolean;

  @ApiProperty({ description: 'Has Vegetarian food options?', required: false })
  hasVegetarianFood: boolean;
}
