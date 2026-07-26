import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StudyLevel, StudyMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProgramAdmissionRequirementDto } from './program-admission-requirement.dto';

/**
 * One program-scoped cost beyond tuition.
 * Stored in the `additionalExpenses` Json column.
 */
export class ProgramAdditionalExpenseItemDto {
  @ApiProperty({ description: 'Expense label', example: 'Student union fee' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Expense amount', example: '150 USD/year' })
  @IsString()
  amount: string;

  @ApiPropertyOptional({
    description: 'Whether the expense is mandatory',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}

export class CreateUniversityProgramDto {
  @ApiProperty({ description: 'University that offers this program' })
  @IsUUID()
  universityId: string;

  @ApiProperty({
    description: 'Program name as offered by this university',
    example: 'BSc Computer Science',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description:
      'Public URL slug. Generated from the title when omitted; must be unique.',
    example: 'bsc-computer-science-1a2b3c4d',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Faculty in the global taxonomy' })
  @IsOptional()
  @IsUUID()
  facultyId?: string;

  @ApiPropertyOptional({
    description: 'Department; must belong to `facultyId` when both are given',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ description: 'Tuition fee', example: 12000 })
  @IsNumber()
  @Min(0)
  tuitionFee: number;

  @ApiPropertyOptional({
    description: 'Tuition fee period',
    default: 'tuition_per_year',
  })
  @IsOptional()
  @IsString()
  tuitionFeeType?: string;

  @ApiPropertyOptional({ description: 'Tuition fee currency', default: 'USD' })
  @IsOptional()
  @IsString()
  tuitionFeeCurrency?: string;

  @ApiProperty({ enum: StudyLevel, example: StudyLevel.BACHELOR })
  @IsEnum(StudyLevel)
  studyLevel: StudyLevel;

  @ApiPropertyOptional({ description: 'Duration in years', example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Tuition fee after the auto-applied scholarship',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  scholarshipAppliedTutionFee?: number;

  @ApiPropertyOptional({ description: 'Rich-text description (English)' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Rich-text description (Russian)' })
  @IsOptional()
  @IsString()
  descriptionRu?: string;

  @ApiPropertyOptional({ description: 'Rich-text description (Uzbek)' })
  @IsOptional()
  @IsString()
  descriptionUz?: string;

  @ApiPropertyOptional({ description: 'Rich-text career outcomes (English)' })
  @IsOptional()
  @IsString()
  careerOutcomesEn?: string;

  @ApiPropertyOptional({ description: 'Rich-text career outcomes (Russian)' })
  @IsOptional()
  @IsString()
  careerOutcomesRu?: string;

  @ApiPropertyOptional({ description: 'Rich-text career outcomes (Uzbek)' })
  @IsOptional()
  @IsString()
  careerOutcomesUz?: string;

  @ApiPropertyOptional({ description: 'Rich-text curriculum (English)' })
  @IsOptional()
  @IsString()
  curriculumEn?: string;

  @ApiPropertyOptional({ description: 'Rich-text curriculum (Russian)' })
  @IsOptional()
  @IsString()
  curriculumRu?: string;

  @ApiPropertyOptional({ description: 'Rich-text curriculum (Uzbek)' })
  @IsOptional()
  @IsString()
  curriculumUz?: string;

  @ApiPropertyOptional({ description: 'Total credits', example: 240 })
  @IsOptional()
  @IsInt()
  @Min(0)
  credits?: number;

  @ApiPropertyOptional({ enum: StudyMode, default: StudyMode.FULL_TIME })
  @IsOptional()
  @IsEnum(StudyMode)
  studyMode?: StudyMode;

  @ApiPropertyOptional({ description: 'Application fee', example: 75 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  applicationFee?: number;

  @ApiPropertyOptional({ description: 'Application fee currency' })
  @IsOptional()
  @IsString()
  applicationFeeCurrency?: string;

  @ApiPropertyOptional({
    description: 'Whether the application fee is refundable',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isApplicationFeeRefundable?: boolean;

  @ApiPropertyOptional({
    description: 'Program-scoped costs beyond tuition',
    type: [ProgramAdditionalExpenseItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramAdditionalExpenseItemDto)
  additionalExpenses?: ProgramAdditionalExpenseItemDto[];

  @ApiPropertyOptional({
    description: 'Hidden programs stay in the DB but never appear publicly',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Highlighted in the catalog',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Language of instruction' })
  @IsOptional()
  @IsUUID()
  studyLanguageId?: string;

  @ApiPropertyOptional({
    description: 'Campuses this program is taught at (replaces the whole set)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  campusIds?: string[];

  @ApiPropertyOptional({
    description: 'Intakes this program accepts (replaces the whole set)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  intakeIds?: string[];

  @ApiPropertyOptional({
    description: 'Structured entry requirements',
    type: ProgramAdmissionRequirementDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProgramAdmissionRequirementDto)
  admissionRequirement?: ProgramAdmissionRequirementDto;
}
