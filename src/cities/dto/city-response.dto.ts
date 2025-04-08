import { ApiProperty } from '@nestjs/swagger';
import { CountryResponseDto } from '../../countries/dto/country-response.dto';

export class CityResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Toshkent' })
  nameUz: string;

  @ApiProperty({ example: 'Ташкент' })
  nameRu: string;

  @ApiProperty({ example: 'Tashkent' })
  nameEn: string;

  @ApiProperty({ example: 860 })
  countryCode: number;

  @ApiProperty({ type: () => CountryResponseDto })
  country: CountryResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedCityResponseDto {
  @ApiProperty({ type: [CityResponseDto] })
  data: CityResponseDto[];

  @ApiProperty({
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
} 