import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  Matches,
  ValidateIf,
} from 'class-validator';
import {
  ApplicationDocumentKind,
  ApplicationDocumentStatus,
} from '@prisma/client';

/** How the checklist names a requirement (see src/admissions/checklist.ts). */
export const REQUIREMENT_KEY =
  /^(kind:[A-Z_]{2,40}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/**
 * Record a document against an application. Exactly one of
 * `partnerApplicationId` / `applicationId` must be provided to identify which
 * application the document belongs to.
 */
export class CreateApplicationDocumentDto {
  @ApiPropertyOptional({
    description: 'Target partner application id (partner-submitted apps).',
  })
  @ValidateIf((o) => !o.applicationId)
  @IsUUID()
  partnerApplicationId?: string;

  @ApiPropertyOptional({
    description: 'Target application id (user-submitted apps).',
  })
  @ValidateIf((o) => !o.partnerApplicationId)
  @IsUUID()
  applicationId?: string;

  @ApiPropertyOptional({
    description:
      'Optional requirement this upload fulfils, as the checklist names it: a ' +
      'document type id, or kind:<KIND> for a document the program asks for.',
  })
  @IsOptional()
  @Matches(REQUIREMENT_KEY, {
    message: 'documentTypeId must be a UUID or kind:<KIND>',
  })
  documentTypeId?: string;

  @ApiProperty({ description: 'Display name of the document.' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'DO Spaces storage key (or legacy URL) of the uploaded file.',
  })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'File size in bytes.' })
  @IsOptional()
  @IsInt()
  fileSize?: number;

  @ApiPropertyOptional({ description: 'MIME type of the file.' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({
    enum: ApplicationDocumentKind,
    description: 'Category of document. Defaults to OTHER.',
  })
  @IsOptional()
  @IsEnum(ApplicationDocumentKind)
  kind?: ApplicationDocumentKind;

  @ApiPropertyOptional({
    enum: ApplicationDocumentStatus,
    description: 'Initial review status. Defaults to PENDING.',
  })
  @IsOptional()
  @IsEnum(ApplicationDocumentStatus)
  status?: ApplicationDocumentStatus;

  @ApiPropertyOptional({
    description: 'Optional free-text comment shown alongside the file.',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'When the document stops being valid.' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
