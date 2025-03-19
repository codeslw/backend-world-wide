import { ApiProperty } from '@nestjs/swagger';
import { UniversityType } from '../../common/enum/university-type.enum';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';

export class UniversityResponseDto {
  @ApiProperty({ description: 'University ID' })
  id: string;

  @ApiProperty({ description: 'University name in Uzbek' })
  nameUz: string;

  @ApiProperty({ description: 'University name in Russian' })
  nameRu: string;

  @ApiProperty({ description: 'University name in English' })
  nameEn: string;

  @ApiProperty({ description: 'Localized university name based on language preference' })
  name: string;

  @ApiProperty({ description: 'Year of establishment' })
  established: number;

  @ApiProperty({ description: 'University type', enum: UniversityType })
  type: UniversityType;

  @ApiProperty({ description: 'University photo URL', type: "string" })
  photoUrl: string;

  @ApiProperty({ description: 'Average application fee' })
  avgApplicationFee: number;

  @ApiProperty({ description: 'Country ID' })
  countryId: string;

  @ApiProperty({ 
    description: 'Country information', 
    type: () => 'CountryResponseDto',
    required: false 
  })
  country?: any;

  @ApiProperty({ description: 'City ID' })
  cityId: string;

  @ApiProperty({ 
    description: 'City information', 
    type: () => 'CityResponseDto',
    required: false 
  })
  city?: any;

  @ApiProperty({ description: 'University description in Uzbek' })
  descriptionUz: string;

  @ApiProperty({ description: 'University description in Russian' })
  descriptionRu: string;

  @ApiProperty({ description: 'University description in English' })
  descriptionEn: string;

  @ApiProperty({ description: 'Localized university description based on language preference' })
  description: string;

  @ApiProperty({ description: 'Winter intake deadline', required: false })
  winterIntakeDeadline?: Date;

  @ApiProperty({ description: 'Autumn intake deadline', required: false })
  autumnIntakeDeadline?: Date;

  @ApiProperty({ description: 'University ranking' })
  ranking: number;

  @ApiProperty({ description: 'Number of students' })
  studentsCount: number;

  @ApiProperty({ description: 'Acceptance rate (percentage)' })
  acceptanceRate: number;

  @ApiProperty({ description: 'University website URL' })
  website: string;

  @ApiProperty({ description: 'Tuition fee ID' })
  tuitionFeeId: number;

  @ApiProperty({ description: 'Tuition fee information', required: false })
  tuitionFee?: any;

  @ApiProperty({ 
    description: 'Programs offered by the university', 
    type: () => 'ProgramResponseDto',
    isArray: true,
    required: false 
  })
  programs?: any[];

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class PaginatedUniversityResponseDto extends PaginatedResponseDto<UniversityResponseDto> {
  @ApiProperty({ type: [UniversityResponseDto] })
  data: UniversityResponseDto[];
} 