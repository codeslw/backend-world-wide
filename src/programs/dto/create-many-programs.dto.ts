import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProgramDto } from './create-program.dto';

export class CreateManyProgramsDto {
  @ApiProperty({
    description: 'Array of programs to create',
    type: [CreateProgramDto],
    isArray: true,
    example: [
      {
        titleUz: 'Bakalavr',
        titleRu: 'Бакалавр',
        titleEn: 'Bachelor',
        descriptionUz: 'Bakalavr dasturi',
        descriptionRu: 'Программа бакалавриата',
        descriptionEn: 'Bachelor program',
        parentId: null,
      },
      {
        titleUz: 'Magistratura',
        titleRu: 'Магистратура',
        titleEn: 'Master',
        descriptionUz: 'Magistratura dasturi',
        descriptionRu: 'Программа магистратуры',
        descriptionEn: 'Master program',
        parentId: null,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateProgramDto)
  programs: CreateProgramDto[];
}
