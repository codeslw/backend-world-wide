import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';
import { UniversityProgramListItemDto } from './university-program-response.dto';

export class PaginatedUniversityProgramResponseDto extends PaginatedResponseDto<UniversityProgramListItemDto> {
  @ApiProperty({ type: [UniversityProgramListItemDto] })
  data: UniversityProgramListItemDto[];
}
