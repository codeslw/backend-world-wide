import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCityDto } from './create-city.dto';

export class CreateManyCitiesDto {
  @ApiProperty({
    description: 'Array of cities to create',
    type: [CreateCityDto],
    isArray: true,
    example: [
      {
        nameUz: "Toshkent",
        nameRu: "Ташкент",
        nameEn: "Tashkent",
        descriptionUz: "O'zbekiston poytaxti",
        descriptionRu: "Столица Узбекистана",
        descriptionEn: "Capital of Uzbekistan",
        countryId: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
      },
      {
        nameUz: "Samarqand",
        nameRu: "Самарканд",
        nameEn: "Samarkand",
        descriptionUz: "Samarqand shahri",
        descriptionRu: "Город Самарканд",
        descriptionEn: "City of Samarkand",
        countryId: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
      }
    ]
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCityDto)
  cities: CreateCityDto[];
} 