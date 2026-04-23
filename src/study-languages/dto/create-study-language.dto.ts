import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateStudyLanguageDto {
  @ApiProperty({ example: 'English' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({ example: 'Английский' })
  @IsString()
  @IsNotEmpty()
  nameRu: string;

  @ApiProperty({ example: 'Ingliz tili' })
  @IsString()
  @IsNotEmpty()
  nameUz: string;
}
