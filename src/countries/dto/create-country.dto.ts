import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ description: 'Country code' })
  @IsNumber()
  @Min(1)
  @Max(999)
  code: number;

  @ApiProperty({ description: 'Country name in Uzbek' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameUz: string;

  @ApiProperty({ description: 'Country name in Russian' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameRu: string;

  @ApiProperty({ description: 'Country name in English' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameEn: string;

  @ApiProperty({ description: 'Country description in Uzbek', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descriptionUz?: string;

  @ApiProperty({ description: 'Country description in Russian', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descriptionRu?: string;

  @ApiProperty({ description: 'Country description in English', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descriptionEn?: string;
} 