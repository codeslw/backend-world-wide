import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UniversityType } from 'src/common/enum/university-type.enum';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';
import { CountryResponseDto } from 'src/countries/dto/country-response.dto';
import { CityResponseDto } from 'src/cities/dto/city-response.dto';

// DTO for representing program details within the university response
class UniversityProgramResponseDto {
  @ApiProperty({ description: 'Program ID' })
  programId: string;

  @ApiProperty({ description: 'Program Title (e.g., in Uzbek)' }) // Adjust language as needed
  titleUz: string;

  @ApiProperty({ description: 'Tuition fee for this program at this university' })
  tuitionFee: number;

  @ApiProperty({ description: 'Tuition fee currency' })
  tuitionFeeCurrency: string;
}

export class UniversityResponseDto {
  @ApiProperty({ description: 'University ID' })
  id: string;

  @ApiProperty({ description: 'University name' })
  name: string;

  // @ApiProperty({ description: 'University name in Russian' })
  // nameRu: string;

  // @ApiProperty({ description: 'University name in English' })
  // nameEn: string;

  @ApiProperty({ description: 'Year of establishment' })
  established: number;

  @ApiProperty({ enum: UniversityType, description: 'Type of university' })
  type: UniversityType;

  @ApiProperty({ description: 'Average application fee' })
  avgApplicationFee: number;

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

  @ApiProperty({ description: 'Winter intake deadline (YYYY-MM-DD)', required: false, type: String })
  winterIntakeDeadline?: string | null; // Allow string or null

  @ApiProperty({ description: 'Autumn intake deadline (YYYY-MM-DD)', required: false, type: String })
  autumnIntakeDeadline?: string | null; // Allow string or null

  @ApiProperty({ description: 'University ranking' })
  ranking: number;

  @ApiProperty({ description: 'Number of students' })
  studentsCount: number;

  @ApiProperty({ description: 'Acceptance rate (percentage)' })
  acceptanceRate: number;

  @ApiProperty({ description: 'University website URL' })
  website: string;

  @ApiProperty({ description: 'University email' })
  email: string;

  @ApiProperty({ description: 'University phone number' })
  phone: string;

  @ApiProperty({ description: 'University address' })
  address: string;

  @ApiProperty({ description: 'University photo URL', required: false })
  photoUrl?: string;

  @ApiProperty({ description: 'Timestamp of creation' })
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp of last update' })
  updatedAt: Date;

  @ApiProperty({ description: 'Country' })
  country: CountryResponseDto;

  @ApiProperty({ description: 'City' })
  city: CityResponseDto;

  @ApiProperty({ type: [UniversityProgramResponseDto], description: 'Programs offered with specific tuition fees' })
  @Type(() => UniversityProgramResponseDto)
  universityPrograms: UniversityProgramResponseDto[];
}

export class PaginatedUniversityResponseDto extends PaginatedResponseDto<UniversityResponseDto> {
  @ApiProperty({ type: [UniversityResponseDto] })
  data: UniversityResponseDto[];
} 