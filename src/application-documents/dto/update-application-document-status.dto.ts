import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
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

  @ApiPropertyOptional({
    description: 'When the document stops being valid; null clears it.',
  })
  @IsOptional()
  @ValidateIf((o) => o.expiresAt !== null)
  @IsDateString()
  expiresAt?: string | null;
}
