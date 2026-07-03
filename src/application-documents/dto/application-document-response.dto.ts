import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ApplicationDocumentKind,
  ApplicationDocumentStatus,
  Role,
} from '@prisma/client';

export class ApplicationDocumentResponseDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional() partnerApplicationId?: string | null;
  @ApiPropertyOptional() applicationId?: string | null;
  @ApiPropertyOptional() documentTypeId?: string | null;
  @ApiPropertyOptional({ description: 'Requirement name, when linked.' })
  documentTypeName?: string | null;

  @ApiProperty() name: string;
  @ApiProperty({ description: 'Stable public URL resolved from the storage key.' })
  fileUrl: string;
  @ApiPropertyOptional() fileSize?: number | null;
  @ApiPropertyOptional() mimeType?: string | null;

  @ApiProperty({ enum: ApplicationDocumentKind }) kind: ApplicationDocumentKind;
  @ApiProperty({ enum: ApplicationDocumentStatus })
  status: ApplicationDocumentStatus;
  @ApiPropertyOptional() reviewNote?: string | null;
  @ApiPropertyOptional({ description: 'Free-text comment shown with the file.' })
  comment?: string | null;

  @ApiPropertyOptional() uploadedById?: string | null;
  @ApiPropertyOptional({ enum: Role }) uploadedByRole?: Role | null;
  @ApiPropertyOptional({ description: 'Uploader display name/email.' })
  uploadedByName?: string | null;

  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
