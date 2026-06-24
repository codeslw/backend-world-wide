import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationDocumentResponseDto } from './application-document-response.dto';

/** A single required document type, with whatever uploads currently fulfil it. */
export class RequirementItemDto {
  @ApiProperty() documentTypeId: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty() required: boolean;
  @ApiProperty({ type: [String] }) fileTypes: string[];
  @ApiProperty() maxSizeMb: number;

  @ApiProperty({
    description:
      'Aggregate status for this requirement derived from its uploads: ' +
      'APPROVED if any upload is approved, REJECTED if all uploads rejected, ' +
      'IN_REVIEW/PENDING if uploads exist but none approved, MISSING if none.',
  })
  status: 'APPROVED' | 'IN_REVIEW' | 'PENDING' | 'REJECTED' | 'MISSING';

  @ApiProperty({ type: [ApplicationDocumentResponseDto] })
  documents: ApplicationDocumentResponseDto[];
}

/** A process step grouping its required document types. */
export class RequirementStepDto {
  @ApiProperty() stepId: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty() order: number;
  @ApiProperty() statusKey: string;
  @ApiProperty({ type: [RequirementItemDto] })
  requirements: RequirementItemDto[];
}

/** Resolved requirements checklist for a single application. */
export class ApplicationRequirementsResponseDto {
  @ApiPropertyOptional({
    description: 'Resolved process template id (program-specific or default).',
  })
  templateId?: string | null;
  @ApiPropertyOptional() templateName?: string | null;
  @ApiProperty({ type: [RequirementStepDto] })
  steps: RequirementStepDto[];

  @ApiProperty({
    description: 'Documents on this application not tied to a requirement type.',
    type: [ApplicationDocumentResponseDto],
  })
  otherDocuments: ApplicationDocumentResponseDto[];
}
