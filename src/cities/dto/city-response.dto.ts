import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';
import { Type } from 'class-transformer';

export class CityResponseDto {
  @ApiProperty({ description: 'City ID' })
  id: string;

  @ApiProperty({ description: 'City name in Uzbek' })
  nameUz: string;

  @ApiProperty({ description: 'City name in Russian' })
  nameRu: string;

  @ApiProperty({ description: 'City name in English' })
  nameEn: string;

  @ApiProperty({ description: 'Localized city name based on language preference' })
  name: string;

  @ApiProperty({ description: 'City description in Uzbek' })
  descriptionUz: string;

  @ApiProperty({ description: 'City description in Russian' })
  descriptionRu: string;

  @ApiProperty({ description: 'City description in English' })
  descriptionEn: string;

  @ApiProperty({ description: 'Localized city description based on language preference' })
  description: string;

  @ApiProperty({ description: 'Country ID this city belongs to' })
  countryId: string;

  @ApiProperty({ 
    description: 'Country this city belongs to', 
    type: () => 'CountryResponseDto',
    required: false 
  })
  country?: any;
}

export class PaginatedCityResponseDto extends PaginatedResponseDto<CityResponseDto> {
  @ApiProperty({ type: [CityResponseDto] })
  data: CityResponseDto[];
} 