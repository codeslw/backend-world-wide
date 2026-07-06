import { ApiProperty } from '@nestjs/swagger';
import { IntakeSeason } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * A program intake can be specified two ways when configuring a university:
 *  1. By `id` — reference an existing global Intake row (legacy / picker flow).
 *  2. By config (`season` [+ optional `startMonth`, `year`, `deadline`]) —
 *     the inline flow. The backend find-or-creates the matching global Intake.
 *
 * Bare-string ids sent by older clients are normalized into `{ id }` before
 * validation, so this DTO also validates those.
 */
export class ProgramIntakeInputDto {
  @ApiProperty({
    description: 'Existing intake id. When present, other fields are ignored.',
    required: false,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    description: 'Academic season (required when no id is provided).',
    enum: IntakeSeason,
    required: false,
  })
  @IsOptional()
  @IsEnum(IntakeSeason)
  season?: IntakeSeason;

  @ApiProperty({
    description: 'Start month 1-12 (defaults to the season first month).',
    required: false,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiProperty({ description: 'Intake year.', required: false, example: 2026 })
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiProperty({
    description:
      'Deadline (ISO). Defaults to 1st of (startMonth - 2) when omitted.',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}
