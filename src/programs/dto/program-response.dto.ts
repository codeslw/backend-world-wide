import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';

export class ProgramResponseDto {
  @ApiProperty({ description: 'Program ID' })
  id: string;

  @ApiProperty({ description: 'Program title in Uzbek' })
  titleUz: string;

  @ApiProperty({ description: 'Program title in Russian' })
  titleRu: string;

  @ApiProperty({ description: 'Program title in English' })
  titleEn: string;

  @ApiProperty({
    description: 'Localized program title based on language preference',
  })
  title: string;

  @ApiProperty({ description: 'Program description in Uzbek' })
  descriptionUz: string;

  @ApiProperty({ description: 'Program description in Russian' })
  descriptionRu: string;

  @ApiProperty({ description: 'Program description in English' })
  descriptionEn: string;

  @ApiProperty({
    description: 'Localized program description based on language preference',
  })
  description: string;

  @ApiProperty({ description: 'Parent program ID', required: false })
  parentId?: string;

  @ApiProperty({
    description: 'Parent program',
    type: () => ProgramResponseDto,
    required: false,
  })
  parent?: ProgramResponseDto;

  @ApiProperty({
    description: 'Child programs',
    type: () => [ProgramResponseDto],
    required: false,
  })
  children?: ProgramResponseDto[];
}

export class PaginatedProgramResponseDto extends PaginatedResponseDto<ProgramResponseDto> {
  @ApiProperty({ type: [ProgramResponseDto] })
  data: ProgramResponseDto[];
}
