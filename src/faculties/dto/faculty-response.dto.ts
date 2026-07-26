import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';
import { DepartmentResponseDto } from '../../departments/dto/department-response.dto';

export class FacultyResponseDto {
  @ApiProperty({ description: 'Faculty ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Stable machine key (slug)' })
  slug: string;

  @ApiProperty({
    description: 'Localized faculty name resolved from the Accept-Language header',
  })
  name: string;

  @ApiProperty({ description: 'Faculty name in English' })
  nameEn: string;

  @ApiProperty({ description: 'Faculty name in Russian' })
  nameRu: string;

  @ApiProperty({ description: 'Faculty name in Uzbek' })
  nameUz: string;

  @ApiPropertyOptional({
    description:
      'Localized faculty description resolved from the Accept-Language header',
    nullable: true,
  })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Description in English', nullable: true })
  descriptionEn?: string | null;

  @ApiPropertyOptional({ description: 'Description in Russian', nullable: true })
  descriptionRu?: string | null;

  @ApiPropertyOptional({ description: 'Description in Uzbek', nullable: true })
  descriptionUz?: string | null;

  @ApiPropertyOptional({ description: 'Icon identifier', nullable: true })
  iconKey?: string | null;

  @ApiProperty({ description: 'Sort order (ascending)' })
  sortOrder: number;

  @ApiProperty({ description: 'Whether the faculty is visible to clients' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Departments of this faculty (when requested)',
    type: () => [DepartmentResponseDto],
  })
  departments?: DepartmentResponseDto[];

  @ApiPropertyOptional({
    description: 'Number of related active university programs (when requested)',
  })
  programCount?: number;
}

export class PaginatedFacultyResponseDto extends PaginatedResponseDto<FacultyResponseDto> {
  @ApiProperty({ type: [FacultyResponseDto] })
  data: FacultyResponseDto[];
}
