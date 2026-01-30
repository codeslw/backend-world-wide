import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';

export class CountryResponseDto {
  @ApiProperty({ description: 'Country code (primary identifier)' })
  code: number;

  @ApiProperty({ description: 'Country name in Uzbek' })
  nameUz: string;

  @ApiProperty({ description: 'Country name in Russian' })
  nameRu: string;

  @ApiProperty({ description: 'Country name in English' })
  nameEn: string;

  @ApiProperty({
    description: 'Localized country name based on language preference',
  })
  name: string;

  @ApiProperty({ description: 'Whether this country is featured as main' })
  isMain: boolean;

  @ApiPropertyOptional({ description: 'Photo URL for the country' })
  photoUrl?: string;

  // General Info
  @ApiPropertyOptional({ description: 'Overview in English' })
  overviewEn?: string;

  @ApiPropertyOptional({ description: 'Overview in Russian' })
  overviewRu?: string;

  @ApiPropertyOptional({ description: 'Overview in Uzbek' })
  overviewUz?: string;

  @ApiPropertyOptional({ description: 'Country images', type: [String] })
  images?: string[];

  // Financial
  @ApiPropertyOptional({ description: 'Proof of funds amount description' })
  proofOfFundsAmount?: string;

  @ApiPropertyOptional({ description: 'Minimum tuition fee' })
  tuitionMin?: number;

  @ApiPropertyOptional({ description: 'Maximum tuition fee' })
  tuitionMax?: number;

  @ApiPropertyOptional({ description: 'Tuition fee currency' })
  tuitionCurrency?: string;

  @ApiPropertyOptional({ description: 'Minimum cost of living' })
  costOfLivingMin?: number;

  @ApiPropertyOptional({ description: 'Maximum cost of living' })
  costOfLivingMax?: number;

  @ApiPropertyOptional({ description: 'Cost of living currency' })
  costOfLivingCurrency?: string;

  @ApiPropertyOptional({ description: 'Scholarship availability description' })
  scholarshipAvailability?: string;

  // Visa
  @ApiPropertyOptional({ description: 'Visa acceptance rate (High/Low)' })
  visaAcceptanceRate?: string;

  @ApiPropertyOptional({ description: 'Visa processing time' })
  visaProcessingTime?: string;

  @ApiPropertyOptional({ description: 'Is visa interview required?' })
  visaInterviewRequired?: boolean;

  @ApiPropertyOptional({ description: 'Are dependent visas available?' })
  dependentVisaAvailable?: boolean;

  // Work Rights
  @ApiPropertyOptional({ description: 'Part-time work hours allowed' })
  partTimeWorkHours?: string;

  @ApiPropertyOptional({ description: 'Post-study work duration' })
  postStudyWorkDuration?: string;

  @ApiPropertyOptional({ description: 'Is PR pathway available?' })
  prPathwayAvailable?: boolean;

  // Academic
  @ApiPropertyOptional({ description: 'Major intakes', type: [String] })
  majorIntakes?: string[];

  @ApiPropertyOptional({ description: 'Application timeline' })
  applicationTimeline?: string;

  @ApiPropertyOptional({
    description: 'Accepted language tests',
    type: [String],
  })
  acceptedLanguageTests?: string[];

  @ApiPropertyOptional({ description: 'Standardized tests required' })
  standardizedTestsRequired?: string;

  @ApiPropertyOptional({ description: 'Gap acceptance policy' })
  gapAcceptance?: string;

  // Life
  @ApiPropertyOptional({ description: 'Accommodation types', type: [String] })
  accommodationTypes?: string[];

  @ApiPropertyOptional({ description: 'Minimum average rent' })
  averageRentMin?: number;

  @ApiPropertyOptional({ description: 'Maximum average rent' })
  averageRentMax?: number;

  @ApiPropertyOptional({ description: 'Rent currency' })
  rentCurrency?: string;

  @ApiPropertyOptional({ description: 'Safety index' })
  safetyIndex?: string;

  @ApiPropertyOptional({ description: 'Healthcare details' })
  healthcareDetails?: string;

  @ApiPropertyOptional({ description: 'International student population' })
  internationalStudentPopulation?: string;

  @ApiPropertyOptional({ description: 'Has Halal food options?' })
  hasHalalFood?: boolean;

  @ApiPropertyOptional({ description: 'Has Vegetarian food options?' })
  hasVegetarianFood?: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class PaginatedCountryResponseDto extends PaginatedResponseDto<CountryResponseDto> {
  @ApiProperty({ type: [CountryResponseDto] })
  data: CountryResponseDto[];
}
