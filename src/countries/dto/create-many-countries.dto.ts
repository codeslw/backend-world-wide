import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCountryDto } from './create-country.dto';

export class CreateManyCountriesDto {
  @ApiProperty({
    description: 'Array of countries to create',
    type: [CreateCountryDto],
    isArray: true,
    example: [
      {
        code: 998,
        nameUz: "O'zbekiston",
        nameRu: 'Узбекистан',
        nameEn: 'Uzbekistan',
        descriptionUz: "O'zbekiston Respublikasi",
        descriptionRu: 'Республика Узбекистан',
        descriptionEn: 'Republic of Uzbekistan',
      },
      {
        code: 7,
        nameUz: 'Rossiya',
        nameRu: 'Россия',
        nameEn: 'Russia',
        descriptionUz: 'Rossiya Federatsiyasi',
        descriptionRu: 'Российская Федерация',
        descriptionEn: 'Russian Federation',
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCountryDto)
  countries: CreateCountryDto[];
}
