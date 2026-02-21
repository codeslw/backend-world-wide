import { ApiProperty } from '@nestjs/swagger';
import { StudyLevel } from '@prisma/client';
import { LanguageRequirementsDto } from './language-requirements.dto';
import { Type } from 'class-transformer';

export class AdmissionRequirementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  universityId: string;

  @ApiProperty({ enum: StudyLevel })
  programLevel: StudyLevel;

  @ApiProperty()
  minEducationLevel: string;

  @ApiProperty()
  minGpa: string;

  @ApiProperty({ type: LanguageRequirementsDto })
  @Type(() => LanguageRequirementsDto)
  languageRequirements: LanguageRequirementsDto;

  @ApiProperty({ type: [String] })
  notes: string[];

  @ApiProperty()
  entryRequirements: string;

  @ApiProperty({ required: false, nullable: true })
  visaFee: number | null;

  @ApiProperty({ required: false, nullable: true })
  visaFeeCurrency: string | null;

  @ApiProperty({ required: false, nullable: true })
  insuranceFee: number | null;

  @ApiProperty({ required: false, nullable: true })
  bankStatement: number | null;

  @ApiProperty({ type: [String] })
  otherExpenses: string[];

  @ApiProperty({ required: false, nullable: true })
  visaRequiredDocuments: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
