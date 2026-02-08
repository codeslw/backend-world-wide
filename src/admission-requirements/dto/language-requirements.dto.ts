import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class LanguageCertificateSectionsDto {
  @ApiProperty({ example: 6.5, required: false })
  @IsOptional()
  listening?: number;

  @ApiProperty({ example: 6.5, required: false })
  @IsOptional()
  reading?: number;

  @ApiProperty({ example: 6.5, required: false })
  @IsOptional()
  speaking?: number;

  @ApiProperty({ example: 6.5, required: false })
  @IsOptional()
  writing?: number;
}

export class LanguageScoreDto {
  @ApiProperty({ example: 6.5, required: false })
  @IsOptional()
  total?: number;

  @ApiProperty({ type: LanguageCertificateSectionsDto, required: false })
  @IsOptional()
  sections?: LanguageCertificateSectionsDto;
}

export class LanguageRequirementsDto {
  @ApiProperty({ type: LanguageScoreDto, required: false })
  @IsOptional()
  ielts?: LanguageScoreDto;

  @ApiProperty({ type: LanguageScoreDto, required: false })
  @IsOptional()
  toefl?: LanguageScoreDto;

  @ApiProperty({ type: LanguageScoreDto, required: false })
  @IsOptional()
  duolingo?: LanguageScoreDto;
}
