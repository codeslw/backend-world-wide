import { ApiProperty } from '@nestjs/swagger';

export class IntakeResponseDto {
  @ApiProperty({ description: 'Intake ID' })
  id: string;

  @ApiProperty({ description: 'Intake month' })
  month: string;

  @ApiProperty({ description: 'Intake year' })
  year: number;

  @ApiProperty({ description: 'Application deadline' })
  deadline: string;
}
