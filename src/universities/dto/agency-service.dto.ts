import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class TariffDto {
  @ApiProperty({ example: 'Basic' })
  @IsString()
  titleEn: string;

  @ApiProperty({ example: 'Базовый' })
  @IsString()
  titleRu: string;

  @ApiProperty({ example: 'Boshlang\'ich' })
  @IsString()
  titleUz: string;

  @ApiProperty({ example: 'Description' })
  @IsString()
  descriptionEn: string;

  @ApiProperty({ example: 'Описание' })
  @IsString()
  descriptionRu: string;

  @ApiProperty({ example: 'Tavsif' })
  @IsString()
  descriptionUz: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsString()
  discountDeadline?: string;

  @ApiProperty({ example: ['Job 1'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  servicesEn: string[];

  @ApiProperty({ example: ['Работа 1'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  servicesRu: string[];

  @ApiProperty({ example: ['Ish 1'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  servicesUz: string[];

  @ApiPropertyOptional({ example: 'Some notes' })
  @IsOptional()
  @IsString()
  notesEn?: string;

  @ApiPropertyOptional({ example: 'Некоторые заметки' })
  @IsOptional()
  @IsString()
  notesRu?: string;

  @ApiPropertyOptional({ example: 'Ba\'zi eslatmalar' })
  @IsOptional()
  @IsString()
  notesUz?: string;
}

export class AgencyServiceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nameEn: string;

  @ApiProperty()
  nameRu: string;

  @ApiProperty()
  nameUz: string;

  @ApiPropertyOptional({ type: TariffDto })
  basic?: TariffDto;

  @ApiPropertyOptional({ type: TariffDto })
  standard?: TariffDto;

  @ApiPropertyOptional({ type: TariffDto })
  premium?: TariffDto;
}
