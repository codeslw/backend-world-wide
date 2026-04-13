import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TariffDto {
  @ApiProperty({ example: 'Basic' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Description of basic tariff' })
  @IsString()
  description: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: ['Service 1', 'Service 2'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  services: string[];
}

export class CreateAgencyServiceDto {
  @ApiProperty({ example: 'Standard International Service' })
  @IsString()
  name: string;

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
