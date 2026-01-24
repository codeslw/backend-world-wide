import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class ScholarshipLevelDto {
    @ApiProperty({ example: 'Gold' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '$5,000' })
    @IsString()
    @IsNotEmpty()
    value: string;

    @ApiProperty({ example: 3.5 })
    @IsNumber()
    @IsNotEmpty()
    minGpa: number;
}

export class RenewalConditionsDto {
    @ApiProperty({ example: '4 years' })
    @IsString()
    @IsNotEmpty()
    duration: string;

    @ApiProperty({ example: 3.0 })
    @IsNumber()
    @IsNotEmpty()
    minGpa: number;

    @ApiProperty({ example: 30 })
    @IsNumber()
    @IsNotEmpty()
    minCredits: number;

    @ApiPropertyOptional({ example: 'Must maintain a 3.0 GPA...' })
    @IsString()
    @IsOptional()
    description?: string;
}

export class EligibilityDto {
    @ApiProperty({ example: ['UZ', 'US'] })
    @IsArray()
    @IsString({ each: true })
    nationalities: string[];

    @ApiProperty({ example: ['Bachelor', 'Master'] })
    @IsArray()
    @IsString({ each: true })
    programLevels: string[];

    @ApiProperty({ example: ['Freshman', 'Transfer'] })
    @IsArray()
    @IsString({ each: true })
    studentTypes: string[];

    @ApiPropertyOptional({ example: 'Freshman Awards: Available to students...' })
    @IsString()
    @IsOptional()
    criteria?: string;
}

export class CreateScholarshipDto {
    @ApiProperty({
        description: 'Title of the scholarship',
        example: 'Merit-based Scholarship',
    })
    @IsString()
    @IsNotEmpty()
    title: string; // Renamed from name

    @ApiProperty({
        description: 'Description of the scholarship (Markdown/Text)',
        example: 'Scholarship for *outstanding* students.',
    })
    @IsString()
    @IsNotEmpty()
    description: string; // Made required per "required fields akin to title/institutionName" - or maybe description is optional? Prompt says "required fields like title and institutionName". I will assume description is mandatory or at least recommended. I'll keep it NotEmpty to be safe, or Optional if logical. Let's make it NotEmpty as it's a main field.

    @ApiProperty({
        description: 'Name of the institution',
        example: 'Harvard University',
    })
    @IsString()
    @IsNotEmpty()
    institutionName: string;

    @ApiPropertyOptional({
        description: 'Source URL',
        example: 'https://harvard.edu/scholarships',
    })
    @IsString()
    @IsOptional()
    sourceUrl?: string;

    @ApiProperty({
        description: 'ID of the university offering the scholarship',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsNotEmpty()
    universityId: string;

    @ApiPropertyOptional({
        description: 'IDs of the programs the scholarship applies to',
        example: ['123e4567-e89b-12d3-a456-426614174001'],
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    programIds?: string[];

    @ApiPropertyOptional({
        description: 'Amount string (ranges supported)',
        example: '$2,000 - $4,000',
    })
    @IsString()
    @IsOptional()
    amount?: string;

    @ApiPropertyOptional({
        description: 'Currency code',
        example: 'USD',
    })
    @IsString()
    @IsOptional()
    currency?: string;

    @ApiPropertyOptional({
        description: 'Is automatically applied?',
        example: false,
    })
    @IsBoolean()
    @IsOptional()
    isAutoApplied: boolean;

    @ApiPropertyOptional({
        description: 'Scholarship Levels',
        type: [ScholarshipLevelDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ScholarshipLevelDto)
    @IsOptional()
    levels?: ScholarshipLevelDto[];

    @ApiPropertyOptional({
        description: 'Renewal Conditions',
        type: RenewalConditionsDto,
    })
    @ValidateNested()
    @Type(() => RenewalConditionsDto)
    @IsOptional()
    renewalConditions?: RenewalConditionsDto;

    @ApiPropertyOptional({
        description: 'Eligibility Criteria',
        type: EligibilityDto,
    })
    @ValidateNested()
    @Type(() => EligibilityDto)
    @IsOptional()
    eligibility?: EligibilityDto;
}
