import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScholarshipResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  isAutoApplied: boolean;

  @ApiProperty()
  nationalities: string[];

  @ApiProperty()
  programLevels: string[];

  @ApiProperty()
  overview: string;

  @ApiPropertyOptional()
  howItWorks?: string;

  @ApiPropertyOptional()
  scholarshipValue?: string;

  @ApiPropertyOptional()
  importantNotes?: string;

  @ApiProperty()
  eligibilityCriteria: string;

  @ApiPropertyOptional()
  sourceUrl?: string;

  @ApiProperty()
  universityId: string;

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  university?: any;

  @ApiPropertyOptional()
  programs?: any[];
}
