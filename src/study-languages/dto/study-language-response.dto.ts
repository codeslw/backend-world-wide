import { ApiProperty } from '@nestjs/swagger';

export class StudyLanguageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nameEn: string;

  @ApiProperty()
  nameRu: string;

  @ApiProperty()
  nameUz: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
