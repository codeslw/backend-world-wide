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

export class AgencyServiceDto {
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
}
