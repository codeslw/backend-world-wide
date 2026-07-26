import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';
import { FacultyResponseDto } from '../../faculties/dto/faculty-response.dto';

export class DepartmentResponseDto {
  @ApiProperty({ description: 'Department ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Owning faculty ID (UUID)' })
  facultyId: string;

  @ApiProperty({ description: 'Machine key, unique within the faculty' })
  slug: string;

  @ApiProperty({
    description:
      'Localized department name resolved from the Accept-Language header',
  })
  name: string;

  @ApiProperty({ description: 'Department name in English' })
  nameEn: string;

  @ApiProperty({ description: 'Department name in Russian' })
  nameRu: string;

  @ApiProperty({ description: 'Department name in Uzbek' })
  nameUz: string;

  @ApiPropertyOptional({
    description:
      'Localized department description resolved from the Accept-Language header',
    nullable: true,
  })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Description in English', nullable: true })
  descriptionEn?: string | null;

  @ApiPropertyOptional({ description: 'Description in Russian', nullable: true })
  descriptionRu?: string | null;

  @ApiPropertyOptional({ description: 'Description in Uzbek', nullable: true })
  descriptionUz?: string | null;

  @ApiProperty({ description: 'Sort order (ascending)' })
  sortOrder: number;

  @ApiProperty({ description: 'Whether the department is visible to clients' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Owning faculty (when requested)',
    type: () => FacultyResponseDto,
  })
  faculty?: FacultyResponseDto;

  @ApiPropertyOptional({
    description: 'Number of related active university programs (when requested)',
  })
  programCount?: number;
}

export class PaginatedDepartmentResponseDto extends PaginatedResponseDto<DepartmentResponseDto> {
  @ApiProperty({ type: [DepartmentResponseDto] })
  data: DepartmentResponseDto[];
}
