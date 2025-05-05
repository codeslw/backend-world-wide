import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateUniversityDto } from './create-university.dto';

export class CreateManyUniversitiesDto {
  @ApiProperty({
    type: [CreateUniversityDto],
    description: 'An array of university data objects to create.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUniversityDto)
  universities: CreateUniversityDto[];
} 