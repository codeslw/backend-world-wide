import { ApiProperty } from '@nestjs/swagger';
import { City } from '../../cities/entities/city.entity';

export class Country {
  @ApiProperty({ description: 'Country code (primary identifier)' })
  code: number;

  @ApiProperty({ description: 'Country name in Uzbek' })
  nameUz: string;

  @ApiProperty({ description: 'Country name in Russian' })
  nameRu: string;

  @ApiProperty({ description: 'Country name in English' })
  nameEn: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Cities in this country',
    type: [City],
    required: false,
  })
  cities?: City[];
}
