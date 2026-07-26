import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryDepartmentDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      'Items per page. Up to 200 so clients can load the whole taxonomy for filter dropdowns.',
    default: 20,
    maximum: 200,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by owning faculty ID (used by the cascading UI)',
  })
  @IsOptional()
  @IsUUID()
  facultyId?: string;

  @ApiPropertyOptional({
    description: 'Case-insensitive search over nameEn / nameRu / nameUz / slug',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active flag' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Include `programCount` (number of related active university programs)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeProgramCount?: boolean;
}
