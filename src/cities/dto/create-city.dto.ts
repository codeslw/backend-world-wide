import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateCityDto {
  @ApiProperty({ example: 'Toshkent', description: 'City name in Uzbek' })
  @IsString()
  @IsNotEmpty()
  nameUz: string;

  @ApiProperty({ example: 'Ташкент', description: 'City name in Russian' })
  @IsString()
  @IsNotEmpty()
  nameRu: string;

  @ApiProperty({ example: 'Tashkent', description: 'City name in English' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({ example: 860, description: 'Country code (numeric)' })
  @IsNumber()
  @IsNotEmpty()
  countryCode: number;
} 