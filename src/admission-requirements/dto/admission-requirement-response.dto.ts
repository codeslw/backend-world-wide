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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
