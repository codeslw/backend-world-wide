import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IntakeSeason, PartnerApplicationStatus } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';

export class PartnerApplicationResponseDto {
  @ApiProperty({ description: 'Application ID' })
  id: string;

  @ApiProperty({ description: 'Partner user ID' })
  partnerId: string;

  @ApiPropertyOptional({ description: 'Partner organization ID' })
  partnerOrganizationId?: string | null;

  @ApiPropertyOptional({ description: 'Partner organization (agency) name' })
  partnerOrganizationName?: string | null;

  @ApiProperty({ description: 'Partner student ID' })
  partnerStudentId: string;

  @ApiPropertyOptional({ description: 'Partner student details' })
  partnerStudent?: any;

  @ApiProperty({ description: 'University ID' })
  universityId: string;

  @ApiPropertyOptional({ description: 'University name' })
  universityName?: string;

  @ApiPropertyOptional({ description: 'Country name' })
  countryName?: string;

  @ApiPropertyOptional({ description: 'Student full name' })
  studentName?: string;

  @ApiPropertyOptional({ description: 'Student email' })
  studentEmail?: string;

  @ApiPropertyOptional({ description: 'University logo URL' })
  universityLogoUrl?: string;

  @ApiProperty({ description: 'Program ID' })
  programId: string;

  @ApiPropertyOptional({ description: 'Program name' })
  programName?: string;

  @ApiProperty({ enum: IntakeSeason })
  intakeSeason: IntakeSeason;

  @ApiProperty()
  intakeYear: number;

  @ApiProperty({ enum: PartnerApplicationStatus })
  status: PartnerApplicationStatus;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiPropertyOptional()
  submittedAt?: Date;

  @ApiPropertyOptional()
  reviewedAt?: Date;

  @ApiPropertyOptional()
  englishProficiency?: string;

  @ApiPropertyOptional()
  gpa?: string;

  @ApiPropertyOptional()
  prerequisites?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  adminNotes?: string;

  @ApiPropertyOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    description: 'Admin user id that created this application on the partner\'s behalf, if any',
  })
  createdByAdminId?: string | null;

  @ApiPropertyOptional({
    description: 'True when an admin created this application on behalf of the partner',
  })
  isAdminCreated?: boolean;

  @ApiPropertyOptional()
  backupPrograms?: any[];

  @ApiPropertyOptional()
  documents?: any[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedPartnerApplicationResponseDto extends PaginatedResponseDto<PartnerApplicationResponseDto> {
  @ApiProperty({ type: [PartnerApplicationResponseDto] })
  data: PartnerApplicationResponseDto[];
}
