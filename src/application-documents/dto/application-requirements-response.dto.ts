import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentRequirementKind } from '@prisma/client';
import { ApplicationDocumentResponseDto } from './application-document-response.dto';

export class LocalizedLabelDto {
  @ApiProperty() en: string;
  @ApiProperty() ru: string;
  @ApiProperty() uz: string;
}

/** A file on the applicant's profile that answers a requirement. */
export class ProfileFileDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: ['student_document', 'profile'] }) source: string;
  @ApiProperty({ enum: DocumentRequirementKind }) kind: DocumentRequirementKind;
  @ApiProperty() type: string;
  @ApiProperty() name: string;
  @ApiProperty() fileUrl: string;
  @ApiPropertyOptional() fileSize?: number | null;
  @ApiPropertyOptional() mimeType?: string | null;
  @ApiPropertyOptional() expiresAt?: Date | null;
  @ApiPropertyOptional() createdAt?: Date | null;
}

/** A single required document, with whatever currently fulfils it. */
export class RequirementItemDto {
  @ApiProperty({
    description:
      'A process-template document type id, or kind:<KIND> for a document the ' +
      'program asks for. Pass it back as documentTypeId when uploading.',
  })
  documentTypeId: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty() required: boolean;
  @ApiProperty({ type: [String] }) fileTypes: string[];
  @ApiProperty() maxSizeMb: number;

  @ApiProperty({
    description:
      'Aggregate status for this requirement derived from its uploads: ' +
      'APPROVED if any upload is approved, REJECTED if all uploads rejected, ' +
      'IN_REVIEW/PENDING if uploads exist but none approved, PENDING when only ' +
      'the profile answers it, MISSING if nothing does.',
  })
  status: 'APPROVED' | 'IN_REVIEW' | 'PENDING' | 'REJECTED' | 'MISSING';

  @ApiPropertyOptional({ enum: DocumentRequirementKind })
  kind?: DocumentRequirementKind | null;
  @ApiProperty({ enum: ['template', 'program', 'both'] }) askedBy: string;
  @ApiPropertyOptional({ type: LocalizedLabelDto })
  label?: LocalizedLabelDto | null;
  @ApiPropertyOptional({ type: LocalizedLabelDto })
  notes?: LocalizedLabelDto | null;
  @ApiPropertyOptional() quantity?: number | null;

  @ApiProperty({ type: [ApplicationDocumentResponseDto] })
  documents: ApplicationDocumentResponseDto[];
  @ApiProperty({ type: [ProfileFileDto] })
  profileFiles: ProfileFileDto[];
}

/** A process step grouping its required document types. */
export class RequirementStepDto {
  @ApiProperty() stepId: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty() order: number;
  @ApiProperty() statusKey: string;
  @ApiProperty({
    description: 'Stage of the admission process the step belongs to, 1 to 7.',
  })
  stage: number;
  @ApiProperty({ type: [RequirementItemDto] })
  requirements: RequirementItemDto[];
}

export class RequirementsSummaryDto {
  @ApiProperty() required: number;
  @ApiProperty() uploaded: number;
  @ApiProperty() approved: number;
  @ApiProperty() rejected: number;
}

/** Resolved requirements checklist for a single application. */
export class ApplicationRequirementsResponseDto {
  @ApiPropertyOptional({
    description: 'Resolved process template id (program-specific or default).',
  })
  templateId?: string | null;
  @ApiPropertyOptional() templateName?: string | null;
  @ApiProperty({ description: 'The program asks for an interview.' })
  interviewRequired: boolean;
  @ApiProperty({
    type: RequirementsSummaryDto,
    description: 'Progress over the required documents.',
  })
  summary: RequirementsSummaryDto;
  @ApiProperty({ type: [RequirementStepDto] })
  steps: RequirementStepDto[];

  @ApiProperty({
    description: 'Documents on this application not tied to a requirement.',
    type: [ApplicationDocumentResponseDto],
  })
  otherDocuments: ApplicationDocumentResponseDto[];
}
