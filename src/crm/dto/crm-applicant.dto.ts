import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, MaritalStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

/** A field that may be left out (no change) or null (cleared). */
const Clearable = (key: string) =>
  ValidateIf((o) => o[key] !== undefined && o[key] !== null);

export class CrmEducationDto {
  /** Row this entry updates; absent adds one. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  level: string;

  @ApiPropertyOptional()
  @Clearable('institution')
  @IsString()
  @MaxLength(300)
  institution?: string | null;

  @ApiPropertyOptional()
  @Clearable('graduationYear')
  @IsInt()
  @Min(1950)
  @Max(2100)
  graduationYear?: number | null;

  @ApiPropertyOptional()
  @Clearable('gpa')
  @IsString()
  @MaxLength(20)
  gpa?: string | null;

  @ApiPropertyOptional()
  @Clearable('gpaScale')
  @IsString()
  @MaxLength(20)
  gpaScale?: string | null;

  @ApiPropertyOptional()
  @Clearable('country')
  @IsString()
  @MaxLength(100)
  country?: string | null;
}

export class CrmTestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  test: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  score: string;

  @ApiPropertyOptional()
  @Clearable('date')
  @IsDateString()
  date?: string | null;
}

/** A change to an applicant's profile made in edu-crm. Absent fields stay. */
export class UpdateCrmApplicantDto {
  @ApiPropertyOptional()
  @Clearable('middleName')
  @IsString()
  @MaxLength(100)
  middleName?: string | null;

  @ApiPropertyOptional()
  @Clearable('dateOfBirth')
  @IsDateString()
  dateOfBirth?: string | null;

  @ApiPropertyOptional({ enum: Gender })
  @Clearable('gender')
  @IsEnum(Gender)
  gender?: Gender | null;

  @ApiPropertyOptional()
  @Clearable('nationality')
  @IsString()
  @MaxLength(100)
  nationality?: string | null;

  @ApiPropertyOptional({ enum: MaritalStatus })
  @Clearable('maritalStatus')
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus | null;

  @ApiPropertyOptional()
  @Clearable('passportNumber')
  @IsString()
  @MaxLength(50)
  passportNumber?: string | null;

  @ApiPropertyOptional()
  @Clearable('passportExpiryDate')
  @IsDateString()
  passportExpiryDate?: string | null;

  @ApiPropertyOptional()
  @Clearable('address')
  @IsString()
  @MaxLength(300)
  address?: string | null;

  @ApiPropertyOptional()
  @Clearable('city')
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @ApiPropertyOptional()
  @Clearable('country')
  @IsString()
  @MaxLength(100)
  country?: string | null;

  @ApiPropertyOptional()
  @Clearable('fatherFullName')
  @IsString()
  @MaxLength(200)
  fatherFullName?: string | null;

  @ApiPropertyOptional()
  @Clearable('motherFullName')
  @IsString()
  @MaxLength(200)
  motherFullName?: string | null;

  @ApiPropertyOptional()
  @Clearable('emergencyName')
  @IsString()
  @MaxLength(200)
  emergencyName?: string | null;

  @ApiPropertyOptional()
  @Clearable('emergencyPhone')
  @IsString()
  @MaxLength(40)
  emergencyPhone?: string | null;

  @ApiPropertyOptional()
  @Clearable('emergencyRelation')
  @IsString()
  @MaxLength(100)
  emergencyRelation?: string | null;

  @ApiPropertyOptional({ type: [CrmEducationDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CrmEducationDto)
  education?: CrmEducationDto[];

  @ApiPropertyOptional({ type: [CrmTestDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CrmTestDto)
  tests?: CrmTestDto[];
}
