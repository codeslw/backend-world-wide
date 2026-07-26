import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DegreeType,
  DocumentRequirementKind,
  LanguageTestType,
  RequirementStatus,
  StandardizedTestType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsWithinLanguageTestRange } from '../validators/language-test-score-range.validator';

/**
 * One accepted English test and the minimum scores required for it.
 * Several entries mean the applicant satisfies the requirement by meeting
 * ANY one of them. `test` is unique inside a single requirement payload
 * (the DB enforces @@unique([requirementId, test])).
 */
export class ProgramLanguageTestRequirementDto {
  @ApiProperty({ enum: LanguageTestType, example: LanguageTestType.IELTS })
  @IsEnum(LanguageTestType)
  test: LanguageTestType;

  @ApiPropertyOptional({ description: 'Minimum overall score', example: 6.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @IsWithinLanguageTestRange('total')
  minTotal?: number;

  @ApiPropertyOptional({ description: 'Minimum listening score', example: 6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @IsWithinLanguageTestRange('section')
  minListening?: number;

  @ApiPropertyOptional({ description: 'Minimum reading score', example: 6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @IsWithinLanguageTestRange('section')
  minReading?: number;

  @ApiPropertyOptional({ description: 'Minimum writing score', example: 6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @IsWithinLanguageTestRange('section')
  minWriting?: number;

  @ApiPropertyOptional({ description: 'Minimum speaking score', example: 6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @IsWithinLanguageTestRange('section')
  minSpeaking?: number;
}

export class ProgramStandardizedTestRequirementDto {
  @ApiProperty({
    enum: StandardizedTestType,
    example: StandardizedTestType.GRE,
  })
  @IsEnum(StandardizedTestType)
  test: StandardizedTestType;

  @ApiPropertyOptional({ description: 'Minimum score', example: 310 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minScore?: number;

  @ApiPropertyOptional({
    enum: RequirementStatus,
    default: RequirementStatus.REQUIRED,
  })
  @IsOptional()
  @IsEnum(RequirementStatus)
  status?: RequirementStatus;
}

export class ProgramDocumentRequirementDto {
  @ApiProperty({
    enum: DocumentRequirementKind,
    example: DocumentRequirementKind.TRANSCRIPT,
  })
  @IsEnum(DocumentRequirementKind)
  kind: DocumentRequirementKind;

  @ApiPropertyOptional({
    enum: RequirementStatus,
    default: RequirementStatus.REQUIRED,
  })
  @IsOptional()
  @IsEnum(RequirementStatus)
  status?: RequirementStatus;

  @ApiPropertyOptional({
    description: 'How many copies are expected (e.g. 2 recommendation letters)',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Display label override (English)' })
  @IsOptional()
  @IsString()
  labelEn?: string;

  @ApiPropertyOptional({ description: 'Display label override (Russian)' })
  @IsOptional()
  @IsString()
  labelRu?: string;

  @ApiPropertyOptional({ description: 'Display label override (Uzbek)' })
  @IsOptional()
  @IsString()
  labelUz?: string;

  @ApiPropertyOptional({ description: 'Notes (English)' })
  @IsOptional()
  @IsString()
  notesEn?: string;

  @ApiPropertyOptional({ description: 'Notes (Russian)' })
  @IsOptional()
  @IsString()
  notesRu?: string;

  @ApiPropertyOptional({ description: 'Notes (Uzbek)' })
  @IsOptional()
  @IsString()
  notesUz?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

/**
 * Machine-readable entry requirements for a single program. Strictly typed
 * (no free-form Json) so the eligibility engine can express them as SQL.
 */
export class ProgramAdmissionRequirementDto {
  @ApiPropertyOptional({
    enum: DegreeType,
    description: 'Minimum prior qualification the applicant must hold',
    example: DegreeType.HIGH_SCHOOL,
  })
  @IsOptional()
  @IsEnum(DegreeType)
  minEducationLevel?: DegreeType;

  @ApiPropertyOptional({
    description: 'Minimum GPA expressed on `gpaScale`',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minGpa?: number;

  @ApiPropertyOptional({
    description: 'Scale the minGpa is expressed on',
    default: 4,
    example: 4,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  gpaScale?: number;

  @ApiPropertyOptional({
    description: 'Subjects the applicant must have studied previously',
    type: [String],
    example: ['Mathematics', 'Physics'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSubjects?: string[];

  @ApiPropertyOptional({ description: 'Minimum work experience in years' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minWorkExperienceYears?: number;

  @ApiPropertyOptional({ description: 'Minimum applicant age' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minAge?: number;

  @ApiPropertyOptional({ description: 'Maximum applicant age' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxAge?: number;

  @ApiPropertyOptional({ description: 'An interview is part of admission' })
  @IsOptional()
  @IsBoolean()
  requiresInterview?: boolean;

  @ApiPropertyOptional({ description: 'A portfolio must be submitted' })
  @IsOptional()
  @IsBoolean()
  requiresPortfolio?: boolean;

  @ApiPropertyOptional({
    description:
      'True when the English requirement can be dropped (e.g. prior study in English)',
  })
  @IsOptional()
  @IsBoolean()
  englishRequirementWaivable?: boolean;

  @ApiPropertyOptional({ description: 'English waiver note (English)' })
  @IsOptional()
  @IsString()
  englishWaiverNoteEn?: string;

  @ApiPropertyOptional({ description: 'English waiver note (Russian)' })
  @IsOptional()
  @IsString()
  englishWaiverNoteRu?: string;

  @ApiPropertyOptional({ description: 'English waiver note (Uzbek)' })
  @IsOptional()
  @IsString()
  englishWaiverNoteUz?: string;

  @ApiPropertyOptional({ description: 'Additional notes (English)' })
  @IsOptional()
  @IsString()
  additionalNotesEn?: string;

  @ApiPropertyOptional({ description: 'Additional notes (Russian)' })
  @IsOptional()
  @IsString()
  additionalNotesRu?: string;

  @ApiPropertyOptional({ description: 'Additional notes (Uzbek)' })
  @IsOptional()
  @IsString()
  additionalNotesUz?: string;

  @ApiPropertyOptional({
    description: 'Accepted English tests; the applicant must meet ANY of them',
    type: [ProgramLanguageTestRequirementDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((entry: ProgramLanguageTestRequirementDto) => entry?.test, {
    message:
      'Duplicate language test entries are not allowed: each test may appear only once',
  })
  @ValidateNested({ each: true })
  @Type(() => ProgramLanguageTestRequirementDto)
  languageTests?: ProgramLanguageTestRequirementDto[];

  @ApiPropertyOptional({
    description: 'Standardized test requirements (GRE/GMAT/SAT/...)',
    type: [ProgramStandardizedTestRequirementDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((entry: ProgramStandardizedTestRequirementDto) => entry?.test, {
    message:
      'Duplicate standardized test entries are not allowed: each test may appear only once',
  })
  @ValidateNested({ each: true })
  @Type(() => ProgramStandardizedTestRequirementDto)
  standardizedTests?: ProgramStandardizedTestRequirementDto[];

  @ApiPropertyOptional({
    description: 'Documents the applicant must (or may) submit',
    type: [ProgramDocumentRequirementDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((entry: ProgramDocumentRequirementDto) => entry?.kind, {
    message:
      'Duplicate document entries are not allowed: each document kind may appear only once',
  })
  @ValidateNested({ each: true })
  @Type(() => ProgramDocumentRequirementDto)
  documents?: ProgramDocumentRequirementDto[];
}
