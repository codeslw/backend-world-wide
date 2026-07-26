import { ApiPropertyOptional } from '@nestjs/swagger';
import { StudyLevel, StudyMode } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export const UNIVERSITY_PROGRAM_SORT_FIELDS = [
  'tuitionFee',
  'title',
  'duration',
  'ranking',
  'createdAt',
] as const;

export type UniversityProgramSortField =
  (typeof UNIVERSITY_PROGRAM_SORT_FIELDS)[number];

/** Accepts `?facultyId=a&facultyId=b` and `?facultyId=a,b` alike. */
const toStringArray = ({ value }: { value: unknown }): string[] | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = Array.isArray(value) ? value : [value];
  const flattened = raw
    .flatMap((item) => `${item}`.split(','))
    .map((item) => item.trim())
    .filter(Boolean);
  return flattened.length ? flattened : undefined;
};

const toBoolean = ({ value }: { value: unknown }) =>
  value === true || value === 'true' || value === 1 || value === '1';

export class UniversityProgramFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      'Free-text search across program title, university name and faculty/department names',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Faculty ids (repeated or comma-separated)',
    type: [String],
  })
  @IsOptional()
  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  facultyId?: string[];

  @ApiPropertyOptional({
    description: 'Department ids (repeated or comma-separated)',
    type: [String],
  })
  @IsOptional()
  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  departmentId?: string[];

  @ApiPropertyOptional({ description: 'Filter by university' })
  @IsOptional()
  @IsUUID()
  universityId?: string;

  @ApiPropertyOptional({ description: 'Filter by campus' })
  @IsOptional()
  @IsUUID()
  campusId?: string;

  @ApiPropertyOptional({ description: 'Filter by country code' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  countryCode?: number;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @ApiPropertyOptional({ enum: StudyLevel })
  @IsOptional()
  @IsEnum(StudyLevel)
  studyLevel?: StudyLevel;

  @ApiPropertyOptional({ enum: StudyMode })
  @IsOptional()
  @IsEnum(StudyMode)
  studyMode?: StudyMode;

  @ApiPropertyOptional({ description: 'Filter by language of instruction' })
  @IsOptional()
  @IsUUID()
  studyLanguageId?: string;

  @ApiPropertyOptional({ description: 'Filter by accepted intake' })
  @IsOptional()
  @IsUUID()
  intakeId?: string;

  @ApiPropertyOptional({ description: 'Minimum tuition fee' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minTuitionFee?: number;

  @ApiPropertyOptional({ description: 'Maximum tuition fee' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxTuitionFee?: number;

  @ApiPropertyOptional({ description: 'Tuition fee currency', example: 'USD' })
  @IsOptional()
  @IsString()
  tuitionFeeCurrency?: string;

  @ApiPropertyOptional({ description: 'Minimum duration in years' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minDuration?: number;

  @ApiPropertyOptional({ description: 'Maximum duration in years' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxDuration?: number;

  @ApiPropertyOptional({
    description: 'Only programs that carry at least one visible scholarship',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  hasScholarship?: boolean;

  @ApiPropertyOptional({ description: 'Only featured programs' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description:
      'Student IELTS total. Keeps programs whose IELTS requirement is <= this score (and programs with no IELTS requirement).',
    example: 6.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxIeltsTotal?: number;

  @ApiPropertyOptional({
    description:
      'Student TOEFL iBT total. Keeps programs whose TOEFL iBT requirement is <= this score.',
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxToeflTotal?: number;

  @ApiPropertyOptional({
    description:
      'Student Duolingo total. Keeps programs whose Duolingo requirement is <= this score.',
    example: 110,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxDuolingoTotal?: number;

  @ApiPropertyOptional({
    description:
      'Student GPA on a 4.0 scale. Keeps programs whose required GPA, normalised to a 4.0 scale (minGpa / gpaScale * 4), is <= this value.',
    example: 3.2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxRequiredGpa?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: UNIVERSITY_PROGRAM_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(UNIVERSITY_PROGRAM_SORT_FIELDS as unknown as string[])
  sortBy?: UniversityProgramSortField;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc';
}
