import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, MaxLength, MinLength } from 'class-validator';

export class CreateTuitionFeeDto {
  @ApiProperty({ description: 'Minimum tuition fee amount' })
  @IsNumber()
  @Min(0)
  minAmount: number;

  @ApiProperty({ description: 'Maximum tuition fee amount' })
  @IsNumber()
  @Min(0)
  maxAmount: number;

  @ApiProperty({ description: 'Currency code (e.g., USD, EUR)' })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency: string;
} 