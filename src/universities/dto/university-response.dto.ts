import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UniversityType } from '../../common/enum/university-type.enum';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';
import { CountryResponseDto } from '../../countries/dto/country-response.dto';
import { CityResponseDto } from '../../cities/dto/city-response.dto';
import { UniversityRequirementsDto } from './university-requirements.dto';
import { Currency } from '../../common/enum/currency.enum';
import { StudyLevel } from '../../common/enum/study-level.enum';
import { IntakeResponseDto } from './intake-response.dto';

// DTO for representing program details within the university response
class UniversityProgramResponseDto {
  @ApiProperty({ description: 'Program ID' })
  programId: string;

  @ApiProperty({ description: 'Program Title (e.g., in Uzbek)' }) // Adjust language as needed
  titleUz: string;

  @ApiProperty({
    description: 'Tuition fee for this program at this university',
  })
  tuitionFee: number;

  @ApiProperty({ description: 'Tuition fee currency', enum: Currency })
  tuitionFeeCurrency: Currency;

  @ApiProperty({ description: 'Study level', enum: StudyLevel })
  studyLevel: StudyLevel;

  @ApiProperty({ description: 'Available intakes', type: [IntakeResponseDto] })
  intakes: IntakeResponseDto[];
}

export class UniversityResponseDto {
  @ApiProperty({ description: 'University ID' })
  id: string;

  @ApiProperty({ description: 'University name' })
  name: string;

  @ApiProperty({ description: 'Year of establishment' })
  established: number;

  @ApiProperty({ enum: UniversityType, description: 'Type of university' })
  type: UniversityType;

  @ApiPropertyOptional({ description: 'Average application fee' })
  avgApplicationFee?: number;

  @ApiPropertyOptional({
    description: 'Application fee currency',
    enum: Currency,
  })
  applicationFeeCurrency?: Currency;

  @ApiProperty({ description: 'Country Code' }) // Changed from countryId for clarity
  countryCode: number;

  @ApiProperty({ description: 'City ID' })
  cityId: string;

  @ApiProperty({ description: 'Description in Uzbek' })
  descriptionUz: string;

  @ApiProperty({ description: 'Description in Russian' })
  descriptionRu: string;

  @ApiProperty({ description: 'Description in English' })
  descriptionEn: string;

  @ApiPropertyOptional({
    description: 'Winter intake deadline (YYYY-MM-DD)',
    type: String,
  })
  winterIntakeDeadline?: string | null; // Allow string or null

  @ApiPropertyOptional({
    description: 'Autumn intake deadline (YYYY-MM-DD)',
    type: String,
  })
  autumnIntakeDeadline?: string | null; // Allow string or null

  @ApiPropertyOptional({ description: 'University ranking' })
  ranking?: number;

  @ApiPropertyOptional({ description: 'Number of students' })
  studentsCount?: number;

  @ApiPropertyOptional({ description: 'Acceptance rate (percentage)' })
  acceptanceRate?: number;

  @ApiPropertyOptional({ description: 'University website URL' })
  website?: string;

  @ApiProperty({ description: 'University email' })
  email: string;

  @ApiProperty({ description: 'University phone number' })
  phone: string;

  @ApiProperty({ description: 'University address' })
  address: string;

  @ApiPropertyOptional({ description: 'University photo URL' })
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional URLs to photos of the university',
    type: [String],
  })
  additionalPhotoUrls?: string[];

  @ApiProperty({ description: 'Whether this university is featured as main' })
  isMain: boolean;

  @ApiProperty({ description: 'Timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'Timestamp of last update' })
  updatedAt: string;

  @ApiProperty({ description: 'Country' })
  country: CountryResponseDto;

  @ApiProperty({ description: 'City' })
  city: CityResponseDto;

  @ApiProperty({
    type: [UniversityProgramResponseDto],
    description: 'Programs offered with specific tuition fees',
  })
  @Type(() => UniversityProgramResponseDto)
  universityPrograms: UniversityProgramResponseDto[];

  @ApiPropertyOptional({
    description: 'Admission requirements for the university',
  })
  requirements?: UniversityRequirementsDto;
}

export class PaginatedUniversityResponseDto extends PaginatedResponseDto<UniversityResponseDto> {
  @ApiProperty({ type: [UniversityResponseDto] })
  data: UniversityResponseDto[];
}
