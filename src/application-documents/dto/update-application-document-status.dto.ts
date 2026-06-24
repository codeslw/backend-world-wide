import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationDocumentStatus } from '@prisma/client';

/** Admin/reviewer updates the review status of an application document. */
export class UpdateApplicationDocumentStatusDto {
  @ApiProperty({ enum: ApplicationDocumentStatus })
  @IsEnum(ApplicationDocumentStatus)
  status: ApplicationDocumentStatus;

  @ApiPropertyOptional({ description: 'Optional reviewer note (reason).' })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
