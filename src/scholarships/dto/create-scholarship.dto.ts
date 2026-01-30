import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateScholarshipDto {
  @ApiProperty({
    description: 'Title of the scholarship',
    example: 'Merit Excellence Scholarship',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Amount (can be range or percentage)',
    example: '£1,000 - £2,500 GBP',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiPropertyOptional({
    description: 'Is automatically applied?',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isAutoApplied?: boolean;

  @ApiPropertyOptional({
    description: 'Eligible nationalities (array of country codes or names)',
    example: ['UZ', 'KZ', 'TJ'],
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nationalities?: string[];

  @ApiPropertyOptional({
    description: 'Eligible program levels',
    example: [
      '1-Year Post-Secondary Certificate',
      '2-Year Undergraduate Diploma',
      "3-Year Bachelor's Degree",
    ],
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  programLevels?: string[];

  @ApiProperty({
    description: 'Overview of the scholarship (rich text/HTML)',
    example:
      '<p>This scholarship provides financial support to outstanding students...</p>',
  })
  @IsString()
  @IsNotEmpty()
  overview: string;

  @ApiPropertyOptional({
    description: 'How the scholarship works (rich text/HTML)',
    example:
      '<p>Students are automatically considered based on their application...</p>',
  })
  @IsString()
  @IsOptional()
  howItWorks?: string;

  @ApiPropertyOptional({
    description: 'Scholarship value details (rich text/HTML)',
    example: '<p>The scholarship covers up to 50% of tuition fees...</p>',
  })
  @IsString()
  @IsOptional()
  scholarshipValue?: string;

  @ApiPropertyOptional({
    description: 'Important notes (rich text/HTML)',
    example: '<p>Recipients must maintain a minimum GPA of 3.5...</p>',
  })
  @IsString()
  @IsOptional()
  importantNotes?: string;

  @ApiProperty({
    description: 'Eligibility criteria (rich text/HTML)',
    example:
      '<p>Must be an international student with excellent academic record...</p>',
  })
  @IsString()
  @IsNotEmpty()
  eligibilityCriteria: string;

  @ApiPropertyOptional({
    description: 'Source URL for more information',
    example: 'https://university.edu/scholarships/merit',
  })
  @IsString()
  @IsOptional()
  sourceUrl?: string;

  @ApiProperty({
    description: 'ID of the university offering the scholarship',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  universityId: string;

  @ApiPropertyOptional({
    description: 'IDs of the programs the scholarship applies to (optional)',
    example: ['123e4567-e89b-12d3-a456-426614174001'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  programIds?: string[];
}
