import { ApiProperty } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
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
import { Currency } from '../../common/enum/currency.enum';
import { StudyLevel } from '../../common/enum/study-level.enum';
import { ProgramIntakeInputDto } from './program-intake-input.dto';

export const TUITION_FEE_TYPES = [
  'tuition_per_year',
  'tuition_per_semester',
  'programm_fee',
  'first_year_tuition',
] as const;

export type TuitionFeeType = (typeof TUITION_FEE_TYPES)[number];

export class UniversityProgramDto {
  @ApiProperty({
    description: 'The unique identifier of the program.',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsUUID()
  @IsNotEmpty()
  programId: string;

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
}
