import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ description: 'Owning faculty ID (UUID)' })
  @IsUUID()
  facultyId: string;

  @ApiProperty({
    description:
      'Machine key, unique within the faculty. Lowercase letters, digits and dashes only.',
    example: 'civil-engineering',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, digits and dashes',
  })
  slug: string;

  @ApiProperty({ description: 'Department name in English' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nameEn: string;

  @ApiProperty({ description: 'Department name in Russian' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nameRu: string;

  @ApiProperty({ description: 'Department name in Uzbek' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nameUz: string;

  @ApiPropertyOptional({ description: 'Department description in English' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Department description in Russian' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionRu?: string;

  @ApiPropertyOptional({ description: 'Department description in Uzbek' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionUz?: string;

  @ApiPropertyOptional({ description: 'Sort order (ascending)', default: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the department is visible to clients',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}
