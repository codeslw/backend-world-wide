import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UniversityType } from '../../common/enum/university-type.enum';
import { CountryResponseDto } from '../../countries/dto/country-response.dto';
import { CityResponseDto } from '../../cities/dto/city-response.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';
import { Currency } from '../../common/enum/currency.enum';
import { StudyLevel } from '../../common/enum/study-level.enum';
import { ScholarshipResponseDto } from '../../scholarships/dto/scholarship-response.dto';
import { IntakeResponseDto } from './intake-response.dto';

// Program details within the university-by-program response
export class ProgramDetailsDto {
  @ApiProperty({ description: 'Program ID' })
  programId: string;

  @ApiProperty({ description: 'Localized program title' })
  title: string;

  @ApiProperty({ description: 'Localized program description', required: false })
  description?: string;

  @ApiProperty({ description: 'Tuition fee for this program' })
  tuitionFee: number;

  @ApiProperty({ description: 'Tuition fee currency', enum: Currency })
  tuitionFeeCurrency: Currency;

  @ApiProperty({ description: 'Study level', enum: StudyLevel })
  studyLevel: StudyLevel;

  @ApiPropertyOptional({
    description: 'Duration of the program in months. Can accept decimal values like 1.5 or 2.5.',
    example: 2.5
  })
  duration?: number;

  @ApiPropertyOptional({
    description: 'Scholarships available for this program',
    type: [ScholarshipResponseDto]
  })
  scholarships?: ScholarshipResponseDto[];

  @ApiPropertyOptional({
    description: 'Intakes available for this program',
    type: [IntakeResponseDto]
  })
  intakes?: IntakeResponseDto[];
}

// Response DTO for each university-program combination
export class UniversityByProgramResponseDto {
  @ApiProperty({ description: 'University ID' })
  universityId: string;

  @ApiProperty({ description: 'University name' })
  universityName: string;

  @ApiProperty({ description: 'Year of establishment' })
  established: number;

  @ApiProperty({ enum: UniversityType, description: 'Type of university' })
  type: UniversityType;

  @ApiProperty({ description: 'Description in Uzbek' })
  descriptionUz: string;

  @ApiProperty({ description: 'Description in Russian' })
  descriptionRu: string;

  @ApiProperty({ description: 'Description in English' })
  descriptionEn: string;

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
    description: 'Winter intake deadline (YYYY-MM-DD)',
    type: String,
  })
  winterIntakeDeadline?: string | null;

  @ApiPropertyOptional({
    description: 'Autumn intake deadline (YYYY-MM-DD)',
    type: String,
  })
  autumnIntakeDeadline?: string | null;

  @ApiProperty({ description: 'Country details' })
  country: CountryResponseDto;

  @ApiProperty({ description: 'City details' })
  city: CityResponseDto;

  @ApiProperty({
    type: ProgramDetailsDto,
    description: 'Program details with tuition fee',
  })
  program: ProgramDetailsDto;

  @ApiProperty({ description: 'Timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'Timestamp of last update' })
  updatedAt: string;
}

export class PaginatedUniversityByProgramResponseDto extends PaginatedResponseDto<UniversityByProgramResponseDto> {
  @ApiProperty({ type: [UniversityByProgramResponseDto] })
  data: UniversityByProgramResponseDto[];
}
