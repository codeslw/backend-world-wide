import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MiniApplicationStatus, University } from '@prisma/client';

// Basic University DTO for nested representation
class UniversityBriefDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nameEn: string; // Assuming English name is sufficient for brief view
}

export class MiniApplicationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty({ enum: MiniApplicationStatus })
  status: MiniApplicationStatus;

  @ApiProperty({ description: 'Which form it came from' })
  source: string;

  @ApiPropertyOptional()
  service?: string | null;

  @ApiPropertyOptional()
  country?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  universityId?: string | null;

  @ApiPropertyOptional({ description: 'Who works it in edu-crm' })
  crmAssigneeName?: string | null;

  @ApiPropertyOptional({ description: 'When edu-crm last updated it' })
  crmSyncedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedMiniApplicationResponseDto {
  @ApiProperty({ type: [MiniApplicationResponseDto] })
  data: MiniApplicationResponseDto[];

  @ApiProperty({
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
    },
  })
  meta: any;
}
