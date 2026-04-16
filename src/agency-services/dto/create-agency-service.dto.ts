import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, ValidateNested, IsDateString, Min, Max } from 'class-validator';
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

  @ApiPropertyOptional({ example: 20, description: 'Discount percentage (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z', description: 'Discount deadline in ISO format' })
  @IsOptional()
  @IsDateString()
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
}

export class CreateAgencyServiceDto {
  @ApiProperty({ example: 'Standard Service En' })
  @IsString()
  nameEn: string;

  @ApiProperty({ example: 'Стандартный сервис Ru' })
  @IsString()
  nameRu: string;

  @ApiProperty({ example: 'Standart servis Uz' })
  @IsString()
  nameUz: string;

  @ApiPropertyOptional({ type: [TariffDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TariffDto)
  tariffs?: TariffDto[];

  @ApiPropertyOptional({ type: [String], example: ['uuid-1', 'uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  universityIds?: string[];
}
