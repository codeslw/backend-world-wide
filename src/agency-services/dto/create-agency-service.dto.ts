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

  @ApiProperty({ example: 'Description in English' })
  @IsString()
  descriptionEn: string;

  @ApiProperty({ example: 'Описание на русском' })
  @IsString()
  descriptionRu: string;

  @ApiProperty({ example: 'O\'zbek tilida tavsif' })
  @IsString()
  descriptionUz: string;

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

  @ApiPropertyOptional({ type: TariffDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TariffDto)
  basic?: TariffDto;

  @ApiPropertyOptional({ type: TariffDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TariffDto)
  standard?: TariffDto;

  @ApiPropertyOptional({ type: TariffDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TariffDto)
  premium?: TariffDto;

  @ApiPropertyOptional({ type: [String], example: ['uuid-1', 'uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  universityIds?: string[];
}
