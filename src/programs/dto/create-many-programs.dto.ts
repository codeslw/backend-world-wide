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
        title: 'Bachelor',
        descriptionUz: 'Bakalavr dasturi',
        descriptionRu: 'Программа бакалавриата',
        descriptionEn: 'Bachelor program',
        parentId: null,
      },
      {
        title: 'Master',
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
