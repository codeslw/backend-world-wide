import { ApiProperty } from '@nestjs/swagger';
import { IntakeSeason } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CreateIntakeDto {
  @ApiProperty({
    description: 'Academic season of the intake.',
    enum: IntakeSeason,
    example: IntakeSeason.FALL,
  })
  @IsEnum(IntakeSeason)
  season: IntakeSeason;

  @ApiProperty({
    description:
      'Numeric start month (1-12). Defaults to the season first month ' +
      '(FALL=9, WINTER=12, SPRING=3, SUMMER=6) when omitted.',
    example: 9,
    minimum: 1,
    maximum: 12,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiProperty({ example: 2026 })
  @IsInt()
  year: number;

  @ApiProperty({
    description:
      'Application deadline (ISO date). Defaults to the 1st of the month two ' +
      'months before the start month when omitted. Must be before the start.',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}
