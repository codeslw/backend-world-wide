import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApplicationStatus } from '../../common/enums/application.enum';

export class UpdateApplicationStatusDto {
  @ApiProperty({
    description: 'Application status',
    enum: ApplicationStatus,
    example: ApplicationStatus.APPROVED,
  })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Rejection reason (required when status is REJECTED)',
    example: 'Insufficient academic qualifications',
  })
  @IsOptional()
  @ValidateIf((o) => o.status === ApplicationStatus.REJECTED)
  @IsString()
  reason?: string;
}
