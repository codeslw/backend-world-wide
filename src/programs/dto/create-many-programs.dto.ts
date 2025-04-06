import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProgramDto } from './create-program.dto';

export class CreateManyProgramsDto {
  @ApiProperty({
    description: 'Array of programs to create',
    type: [CreateProgramDto],
    isArray: true
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateProgramDto)
  programs: CreateProgramDto[];
} 