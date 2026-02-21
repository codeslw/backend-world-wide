import { ApiProperty } from '@nestjs/swagger';
import { StudyLevel } from '@prisma/client';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsObject,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LanguageRequirementsDto } from './language-requirements.dto';

export class CreateAdmissionRequirementDto {
  @ApiProperty({ example: 'uuid-of-university' })
  @IsString()
  @IsNotEmpty()
  universityId: string;

  @ApiProperty({ enum: StudyLevel, example: StudyLevel.BACHELOR })
  @IsEnum(StudyLevel)
  programLevel: StudyLevel;

  @ApiProperty({ example: 'High School Diploma' })
  @IsString()
  @IsNotEmpty()
  minEducationLevel: string;

  @ApiProperty({ example: '3.0/4.0' })
  @IsString()
  @IsNotEmpty()
  minGpa: string;

  @ApiProperty({ type: LanguageRequirementsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LanguageRequirementsDto)
  languageRequirements: LanguageRequirementsDto;

  @ApiProperty({ example: ['Note 1', 'Note 2'], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  notes?: string[];

  @ApiProperty({ example: '<p>Rich text content</p>' })
  @IsString()
  @IsNotEmpty()
  entryRequirements: string;

  @ApiProperty({ example: 100, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  visaFee?: number;

  @ApiProperty({ example: 'USD', required: false })
  @IsString()
  @IsOptional()
  visaFeeCurrency?: string;

  @ApiProperty({ example: 200, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  insuranceFee?: number;

  @ApiProperty({ example: 5000, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  bankStatement?: number;

  @ApiProperty({ example: ['Translation fee', 'Notary fee'], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  otherExpenses?: string[];

  @ApiProperty({ example: '<p>Required documents for visa</p>', required: false })
  @IsString()
  @IsOptional()
  visaRequiredDocuments?: string;
}

export class CreateAdmissionRequirementNestedDto {
  @ApiProperty({ enum: StudyLevel, example: StudyLevel.BACHELOR })
  @IsEnum(StudyLevel)
  programLevel: StudyLevel;

  @ApiProperty({ example: 'High School Diploma' })
  @IsString()
  @IsNotEmpty()
  minEducationLevel: string;

  @ApiProperty({ example: '3.0/4.0' })
  @IsString()
  @IsNotEmpty()
  minGpa: string;

  @ApiProperty({ type: LanguageRequirementsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LanguageRequirementsDto)
  languageRequirements: LanguageRequirementsDto;

  @ApiProperty({ example: ['Note 1', 'Note 2'], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  notes?: string[];

  @ApiProperty({ example: '<p>Rich text content</p>' })
  @IsString()
  @IsNotEmpty()
  entryRequirements: string;

  @ApiProperty({ example: 100, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  visaFee?: number;

  @ApiProperty({ example: 'USD', required: false })
  @IsString()
  @IsOptional()
  visaFeeCurrency?: string;

  @ApiProperty({ example: 200, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  insuranceFee?: number;

  @ApiProperty({ example: 5000, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  bankStatement?: number;

  @ApiProperty({ example: ['Translation fee', 'Notary fee'], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  otherExpenses?: string[];

  @ApiProperty({ example: '<p>Required documents for visa</p>', required: false })
  @IsString()
  @IsOptional()
  visaRequiredDocuments?: string;
}
