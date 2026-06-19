import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProgramDto {
  @ApiProperty({ description: 'Program title' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: 'Program description in Uzbek', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descriptionUz?: string;

  @ApiProperty({
    description: 'Program description in Russian',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descriptionRu?: string;

  @ApiProperty({
    description: 'Program description in English',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descriptionEn?: string;

  @ApiProperty({
    description: 'Parent program ID (if this is a child program)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
