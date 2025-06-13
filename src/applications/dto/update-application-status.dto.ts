import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ApplicationStatus } from '../../common/enums/application.enum';

export class UpdateApplicationStatusDto {
  @ApiProperty({
    description: 'Application status',
    enum: ApplicationStatus,
    example: ApplicationStatus.APPROVED,
  })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
} 