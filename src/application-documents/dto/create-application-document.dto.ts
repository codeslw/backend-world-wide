import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import {
  ApplicationDocumentKind,
  ApplicationDocumentStatus,
} from '@prisma/client';

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
    description: 'Optional requirement document type this upload fulfils.',
  })
  @IsOptional()
  @IsUUID()
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
}
