import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { PartnerApplicationStatus } from '@prisma/client';

export class UpdatePartnerApplicationStatusDto {
  @ApiProperty({
    description: 'New application status',
    enum: PartnerApplicationStatus,
  })
  @IsEnum(PartnerApplicationStatus)
  status: PartnerApplicationStatus;

  @ApiPropertyOptional({
    description: 'Rejection reason (required when status is REJECTED)',
  })
  @IsOptional()
  @ValidateIf((o) => o.status === PartnerApplicationStatus.REJECTED)
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
