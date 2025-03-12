import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';

export class ProgramResponseDto {
  @ApiProperty({ description: 'Program ID' })
  id: string;

  @ApiProperty({ description: 'Program name in Uzbek' })
  nameUz: string;

  @ApiProperty({ description: 'Program name in Russian' })
  nameRu: string;

  @ApiProperty({ description: 'Program name in English' })
  nameEn: string;

  @ApiProperty({ description: 'Localized program name based on language preference' })
  name: string;

  @ApiProperty({ description: 'Program description in Uzbek' })
  descriptionUz: string;

  @ApiProperty({ description: 'Program description in Russian' })
  descriptionRu: string;

  @ApiProperty({ description: 'Program description in English' })
  descriptionEn: string;

  @ApiProperty({ description: 'Localized program description based on language preference' })
  description: string;

  @ApiProperty({ description: 'Parent program ID', required: false })
  parentId?: string;

  @ApiProperty({ 
    description: 'Parent program', 
    type: () => ProgramResponseDto,
    required: false 
  })
  parent?: ProgramResponseDto;

  @ApiProperty({ 
    description: 'Child programs', 
    type: () => [ProgramResponseDto],
    required: false 
  })
  children?: ProgramResponseDto[];
}

export class PaginatedProgramResponseDto extends PaginatedResponseDto<ProgramResponseDto> {
  @ApiProperty({ type: [ProgramResponseDto] })
  data: ProgramResponseDto[];
} 