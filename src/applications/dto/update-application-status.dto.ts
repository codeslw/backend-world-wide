import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ACCEPTED_STATUS_VALUES } from '../../admissions/status';

export class UpdateApplicationStatusDto {
  @ApiProperty({
    description:
      'Admission status: the nine shared with partner applications and edu-crm. ' +
      'APPROVED is accepted as the older name of ACCEPTED.',
    enum: ACCEPTED_STATUS_VALUES,
    example: 'ACCEPTED',
  })
  @IsIn(ACCEPTED_STATUS_VALUES)
  status: string;

  @ApiPropertyOptional({
    description: 'Rejection reason (required when status is REJECTED)',
    example: 'Insufficient academic qualifications',
  })
  @IsOptional()
  @ValidateIf((o) => o.status === 'REJECTED')
  @IsString()
  reason?: string;
}
