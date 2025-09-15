import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { LanguageTest } from '@prisma/client';

export class LanguageCertificateDto {
  @ApiProperty({ enum: LanguageTest, description: 'Type of language test' })
  @IsEnum(LanguageTest)
  @IsNotEmpty()
  testType: LanguageTest;

  @ApiProperty({ description: 'The score obtained in the test' })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiPropertyOptional({ description: 'File GUID for the language certificate' })
  @IsOptional()
  @IsUUID()
  certificateGuid?: string;

  @ApiProperty({
    description: 'The date the certificate was issued (ISO-8601 format)',
    example: '2023-09-25T00:00:00.000Z',
  })
  @IsDateString()
  dateOfIssue: string;
}
