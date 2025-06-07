import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateMiniApplicationDto } from './create-mini-application.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { MiniApplicationStatus } from '@prisma/client';

export class UpdateMiniApplicationDto extends PartialType(
  CreateMiniApplicationDto,
) {
  @ApiProperty({
    description: 'The status of the mini application',
    enum: MiniApplicationStatus,
    required: false,
    example: MiniApplicationStatus.CONTACTED,
  })
  @IsOptional()
  @IsEnum(MiniApplicationStatus)
  status?: MiniApplicationStatus;
}
