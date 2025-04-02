import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';
import { Type } from 'class-transformer';

export class CountryResponseDto {
  @ApiProperty({ description: 'Country ID' })
  id: string;

  @ApiProperty({ description: 'Country code' })
  code: number;

  @ApiProperty({ description: 'Country name in Uzbek' })
  nameUz: string;

  @ApiProperty({ description: 'Country name in Russian' })
  nameRu: string;

  @ApiProperty({ description: 'Country name in English' })
  nameEn: string;

  @ApiProperty({ description: 'Localized country name based on language preference' })
  name: string;

  @ApiProperty({ description: 'Country description in Uzbek' })
  descriptionUz: string;

  @ApiProperty({ description: 'Country description in Russian' })
  descriptionRu: string;

  @ApiProperty({ description: 'Country description in English' })
  descriptionEn: string;

  @ApiProperty({ description: 'Localized country description based on language preference' })
  description: string;

  // @ApiProperty({ 
  //   description: 'Cities in this country', 
  //   type: () => 'CityResponseDto', // Use lazy loading to break circular dependency
  //   isArray: true,
  //   required: false 
  // })
  // cities?: any[]; // We'll use any[] here to avoid the import
}

export class PaginatedCountryResponseDto extends PaginatedResponseDto<CountryResponseDto> {
  @ApiProperty({ type: [CountryResponseDto] })
  data: CountryResponseDto[];
} 