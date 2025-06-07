import { ApiProperty } from '@nestjs/swagger';

export class Program {
  @ApiProperty({ description: 'Unique identifier (UUID)' })
  id: string;

  @ApiProperty({ description: 'Program title in Uzbek' })
  titleUz: string;

  @ApiProperty({ description: 'Program title in Russian' })
  titleRu: string;

  @ApiProperty({ description: 'Program title in English', required: false })
  titleEn?: string;

  @ApiProperty({ description: 'Program description in Uzbek', required: false })
  descriptionUz?: string;

  @ApiProperty({
    description: 'Program description in Russian',
    required: false,
  })
  descriptionRu?: string;

  @ApiProperty({
    description: 'Program description in English',
    required: false,
  })
  descriptionEn?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Parent program ID (if any)', required: false })
  parentId?: string;

  @ApiProperty({
    description: 'Child programs',
    type: [Program],
    required: false,
  })
  children?: Program[];

  @ApiProperty({
    description: 'Parent program',
    type: Program,
    required: false,
  })
  parent?: Program;
}
