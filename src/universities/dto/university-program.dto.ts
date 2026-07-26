import { ApiProperty } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  IsArray,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { StudyMode } from '@prisma/client';
import { Currency } from '../../common/enum/currency.enum';
import { StudyLevel } from '../../common/enum/study-level.enum';
import { ProgramIntakeInputDto } from './program-intake-input.dto';

/// One line of program-scoped costs beyond tuition (stored as Json).
export class ProgramExpenseItemDto {
  @ApiProperty({ description: 'Expense label', example: 'Student union fee' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Expense amount', example: '250 USD/year' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({
    description: 'False for optional costs such as an on-campus meal plan.',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;
}

export const TUITION_FEE_TYPES = [
  'tuition_per_year',
  'tuition_per_semester',
  'programm_fee',
  'first_year_tuition',
] as const;

export type TuitionFeeType = (typeof TUITION_FEE_TYPES)[number];

export class UniversityProgramDto {
  @ApiProperty({
    description:
      'Id of an existing university program. Omit to create a new one. ' +
      'Programs are matched on this id when a university is updated, so any ' +
      'existing program left out of the payload is deleted.',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description:
      'Program name as offered by this university. A university program owns ' +
      'its own title; there is no shared program catalog any more.',
    example: 'BSc Computer Science',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Faculty this program belongs to (global taxonomy).',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  facultyId?: string;

  @ApiProperty({
    description:
      'Department this program belongs to. Must belong to `facultyId`.',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({
    description:
      'The tuition fee for this specific program at this university.',
    example: 15000.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  tuitionFee: number;

  @ApiProperty({
    description: 'Type of tuition fee value.',
    example: 'tuition_per_year',
    enum: TUITION_FEE_TYPES,
  })
  @IsString()
  @IsIn(TUITION_FEE_TYPES)
  @IsNotEmpty()
  tuitionFeeType: TuitionFeeType;

  @ApiProperty({
    description: 'The currency of the tuition fee.',
    example: 'USD',
    enum: Currency,
    default: Currency.USD,
    required: false,
  })
  @IsEnum(Currency)
  @IsOptional()
  tuitionFeeCurrency?: Currency = Currency.USD;

  @ApiProperty({
    description: 'The study level for this program at this university.',
    example: StudyLevel.BACHELOR,
    enum: StudyLevel,
  })
  @IsEnum(StudyLevel)
  @IsNotEmpty()
  studyLevel: StudyLevel;

  @ApiProperty({
    description:
      'The duration of the program in years. Can accept decimal values like 1.5 or 2.5.',
    example: 2.5,
    required: false,
    minimum: 0.5,
    maximum: 10,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  @Max(10)
  @IsOptional()
  duration?: number;

  @ApiProperty({
    description: 'The tuition fee after scholarship is applied.',
    example: 10000.0,
    minimum: 0,
    required: false,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  scholarshipAppliedTutionFee?: number;

  @ApiProperty({
    description:
      'The intakes for this program. Each item is either an existing intake ' +
      'id string, or an inline config object { season, startMonth?, year, ' +
      'deadline? } that the backend find-or-creates. Bare id strings are ' +
      'accepted for backward compatibility.',
    required: false,
    type: [ProgramIntakeInputDto],
  })
  @IsOptional()
  @IsArray()
  // Normalize each item into a ProgramIntakeInputDto INSTANCE so nested
  // validation resolves its metadata (a plain object left by a transform trips
  // class-validator's "unknownValue" guard under enableImplicitConversion).
  // Bare-string ids (legacy clients) become { id } instances.
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) =>
          plainToInstance(
            ProgramIntakeInputDto,
            typeof v === 'string' ? { id: v } : v,
          ),
        )
      : value,
  )
  @ValidateNested({ each: true })
  @Type(() => ProgramIntakeInputDto)
  intakes?: ProgramIntakeInputDto[];

  @ApiProperty({
    description: 'Logo URL for the program',
    example: 'https://example.com/logo.png',
    required: false,
  })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({
    description: 'Study language for the program',
    example: 'English',
    required: false,
  })
  @IsString()
  @IsOptional()
  studyLanguage?: string;

  @ApiProperty({
    description: 'Study language ID from catalog',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  studyLanguageId?: string;

  @ApiProperty({
    description: 'List of campus IDs this program is attached to',

    example: ['d290f1ee-6c54-4b01-90e6-d701748f0851'],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  campusIds?: string[];

  @ApiProperty({
    description: 'Rich-text (HTML) program description, English.',
    required: false,
  })
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiProperty({
    description: 'Rich-text (HTML) program description, Russian.',
    required: false,
  })
  @IsString()
  @IsOptional()
  descriptionRu?: string;

  @ApiProperty({
    description: 'Rich-text (HTML) program description, Uzbek.',
    required: false,
  })
  @IsString()
  @IsOptional()
  descriptionUz?: string;

  @ApiProperty({ description: 'Number of academic credits.', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  credits?: number;

  @ApiProperty({
    description: 'How the program is delivered.',
    enum: StudyMode,
    required: false,
    default: StudyMode.FULL_TIME,
  })
  @IsEnum(StudyMode)
  @IsOptional()
  studyMode?: StudyMode;

  @ApiProperty({
    description: 'Program-specific application fee.',
    required: false,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  applicationFee?: number;

  @ApiProperty({
    description: 'Currency of the application fee.',
    enum: Currency,
    required: false,
  })
  @IsEnum(Currency)
  @IsOptional()
  applicationFeeCurrency?: Currency;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isApplicationFeeRefundable?: boolean;

  @ApiProperty({
    description: 'Costs beyond tuition that apply to this program only.',
    type: [ProgramExpenseItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramExpenseItemDto)
  additionalExpenses?: ProgramExpenseItemDto[];

  @ApiProperty({
    description: 'Hidden programs stay in the DB but leave the public catalog.',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}
