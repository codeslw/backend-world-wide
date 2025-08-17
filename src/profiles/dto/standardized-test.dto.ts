import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
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

  @ApiPropertyOptional({ description: 'File GUID for the test certificate' })
  @IsOptional()
  @IsUUID()
  certificateGuid?: string;

  @ApiProperty({
    description: 'The date the test was taken (ISO-8601 format)',
    example: '2023-09-25T00:00:00.000Z',
  })
  @IsDateString()
  dateOfIssue: string;
}
