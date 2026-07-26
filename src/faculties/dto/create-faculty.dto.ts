import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateFacultyDto {
  @ApiProperty({
    description:
      'Stable machine key used for seeding, icons and deep links. Lowercase letters, digits and dashes only.',
    example: 'engineering-technology',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, digits and dashes',
  })
  slug: string;

  @ApiProperty({ description: 'Faculty name in English' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nameEn: string;

  @ApiProperty({ description: 'Faculty name in Russian' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nameRu: string;

  @ApiProperty({ description: 'Faculty name in Uzbek' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nameUz: string;

  @ApiPropertyOptional({ description: 'Faculty description in English' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Faculty description in Russian' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionRu?: string;

  @ApiPropertyOptional({ description: 'Faculty description in Uzbek' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionUz?: string;

  @ApiPropertyOptional({
    description: 'Icon identifier resolved by the clients to a lucide/MUI icon',
    example: 'GraduationCap',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  iconKey?: string;

  @ApiPropertyOptional({ description: 'Sort order (ascending)', default: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the faculty is visible to clients',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}
