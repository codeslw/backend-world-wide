import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, MaxLength, MinLength } from 'class-validator';

export class CreateCityDto {
  @ApiProperty({ description: 'City name in Uzbek' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameUz: string;

  @ApiProperty({ description: 'City name in Russian' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameRu: string;

  @ApiProperty({ description: 'City name in English', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nameEn?: string;

  @ApiProperty({ description: 'City description in Uzbek', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descriptionUz?: string;

  @ApiProperty({ description: 'City description in Russian', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descriptionRu?: string;

  @ApiProperty({ description: 'City description in English', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descriptionEn?: string;

  @ApiProperty({ description: 'Country code this city belongs to' })
  @IsNumber()
  countryCode: number;
} 