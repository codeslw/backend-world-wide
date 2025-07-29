import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
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

  @ApiProperty({ description: 'URL to the language certificate' })
  @IsString()
  @IsUrl()
  certificateUrl: string;

  @ApiProperty({
    description: 'The date the certificate was issued',
    example: '2023-09-25',
  })
  @IsDateString()
  dateOfIssue: Date;
}
