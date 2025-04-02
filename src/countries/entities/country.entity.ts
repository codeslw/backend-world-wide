import { ApiProperty } from '@nestjs/swagger';
import { City } from '../../cities/entities/city.entity';

export class Country {
  @ApiProperty({ description: 'Unique identifier (UUID)' })
  id: string;

  @ApiProperty({ description: 'Country code' })
  code: number;

  @ApiProperty({ description: 'Country name in Uzbek' })
  nameUz: string;

  @ApiProperty({ description: 'Country name in Russian' })
  nameRu: string;

  @ApiProperty({ description: 'Country name in English', required: false })
  nameEn?: string;

  @ApiProperty({ description: 'Country description in Uzbek', required: false })
  descriptionUz?: string;

  @ApiProperty({ description: 'Country description in Russian', required: false })
  descriptionRu?: string;

  @ApiProperty({ description: 'Country description in English', required: false })
  descriptionEn?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Cities in this country', type: [City], required: false })
  cities?: City[];
} 