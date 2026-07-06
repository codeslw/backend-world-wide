import { ApiProperty } from '@nestjs/swagger';
import { IntakeSeason } from '@prisma/client';

export class IntakeResponseDto {
  @ApiProperty({ description: 'Intake ID' })
  id: string;

  @ApiProperty({ description: 'Academic season', enum: IntakeSeason })
  season: IntakeSeason;

  @ApiProperty({ description: 'Numeric start month (1-12)', example: 9 })
  startMonth: number;

  @ApiProperty({
    description: 'Start month name (derived from startMonth)',
    example: 'SEPTEMBER',
  })
  month: string;

  @ApiProperty({ description: 'Intake year' })
  year: number;

  @ApiProperty({ description: 'Application deadline' })
  deadline: string;
}
