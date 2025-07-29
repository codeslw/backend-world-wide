import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  Min,
} from 'class-validator';
import { StandardizedTestType } from '@prisma/client';

export class StandardizedTestDto {
  @ApiProperty({
    enum: StandardizedTestType,
    description: 'Type of standardized test',
  })
  @IsEnum(StandardizedTestType)
  @IsNotEmpty()
  testType: StandardizedTestType;

  @ApiProperty({ description: 'The score obtained in the test' })
  @IsInt()
  @Min(0)
  score: number;

  @ApiPropertyOptional({ description: 'URL to the test certificate' })
  @IsOptional()
  @IsUrl()
  certificateUrl?: string;

  @ApiProperty({
    description: 'The date the test was taken',
    example: '2023-09-25',
  })
  @IsDateString()
  dateOfIssue: Date;
}
