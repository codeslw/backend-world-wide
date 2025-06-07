import { ApiProperty } from '@nestjs/swagger';
import { Country } from '../../countries/entities/country.entity';

export class City {
  @ApiProperty({ description: 'Unique identifier (UUID)' })
  id: string;

  @ApiProperty({ description: 'City name in Uzbek' })
  nameUz: string;

  @ApiProperty({ description: 'City name in Russian' })
  nameRu: string;

  @ApiProperty({ description: 'City name in English', required: false })
  nameEn?: string;

  @ApiProperty({ description: 'City description in Uzbek', required: false })
  descriptionUz?: string;

  @ApiProperty({ description: 'City description in Russian', required: false })
  descriptionRu?: string;

  @ApiProperty({ description: 'City description in English', required: false })
  descriptionEn?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Country ID this city belongs to' })
  countryId: string;

  @ApiProperty({ description: 'Country this city belongs to', type: Country })
  country?: Country;
}
