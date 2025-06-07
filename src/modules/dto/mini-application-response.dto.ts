import { ApiProperty } from '@nestjs/swagger';
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
  email: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty({ enum: MiniApplicationStatus })
  status: MiniApplicationStatus;

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
