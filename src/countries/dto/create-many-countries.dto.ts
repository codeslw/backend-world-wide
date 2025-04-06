import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCountryDto } from './create-country.dto';

export class CreateManyCountriesDto {
  @ApiProperty({
    description: 'Array of countries to create',
    type: [CreateCountryDto],
    isArray: true
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCountryDto)
  countries: CreateCountryDto[];
} 