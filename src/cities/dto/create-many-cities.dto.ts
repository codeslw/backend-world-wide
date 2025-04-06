import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCityDto } from './create-city.dto';

export class CreateManyCitiesDto {
  @ApiProperty({
    description: 'Array of cities to create',
    type: [CreateCityDto],
    isArray: true
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCityDto)
  cities: CreateCityDto[];
} 