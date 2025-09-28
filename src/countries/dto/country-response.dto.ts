import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';
import { Type } from 'class-transformer';

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

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

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
