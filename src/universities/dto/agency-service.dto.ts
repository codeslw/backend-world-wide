import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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

  @ApiProperty({ example: 0 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  currency: string;

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
  servicesUz: string[];

  @ApiPropertyOptional({ example: ['Note 1'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notesEn?: string[];

  @ApiPropertyOptional({ example: ['Заметка 1'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notesRu?: string[];

  @ApiPropertyOptional({ example: ['Eslatma 1'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notesUz?: string[];

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsString()
  discountDeadline?: string;
}

export class AgencyServiceDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Standard Services' })
  @IsString()
  nameEn: string;

  @ApiProperty({ example: 'Стандартные услуги' })
  @IsString()
  nameRu: string;

  @ApiProperty({ example: 'Standart xizmatlar' })
  @IsString()
  nameUz: string;

  @ApiProperty({ type: [TariffDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TariffDto)
  @IsOptional()
  tariffs?: TariffDto[];
}
