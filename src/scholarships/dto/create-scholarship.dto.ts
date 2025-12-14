import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateScholarshipDto {
    @ApiProperty({
        description: 'Name of the scholarship',
        example: 'Merit-based Scholarship',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        description: 'Description of the scholarship',
        example: 'Scholarship for outstanding students.',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        description: 'List of requirements for the scholarship',
        example: ['GPA > 3.5', 'IELTS > 7.0'],
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    requirements?: string[];

    @ApiProperty({
        description: 'ID of the university offering the scholarship',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsNotEmpty()
    universityId: string;

    @ApiProperty({
        description: 'Amount of the scholarship',
        example: 1000,
    })
    @IsNumber()
    @IsOptional()
    amount?: number;

    @ApiProperty({
        description: 'Amount from of the scholarship',
        example: 1000,
    })
    @IsNumber()
    @IsOptional()
    amountFrom?: number;

    @ApiProperty({
        description: 'Amount to of the scholarship',
        example: 1000,
    })
    @IsNumber()
    @IsOptional()
    amountTo?: number;

    @ApiProperty({
        description: 'Amount information of the scholarship',
        example: ['This value will be applied to the total tuition fee'],
    })
    @IsString()
    @IsOptional()
    amountInfo?: string[];

    @ApiProperty({
        description: 'Currency of the scholarship',
        example: 'USD',
    })
    @IsString()
    @IsOptional()
    amountCurrency?: string;

    @ApiPropertyOptional({
        description: 'Percentage of the scholarship',
        example: 10,
    })
    @IsNumber()
    @IsOptional()
    percentage?: number;

    @ApiPropertyOptional({
        description: 'Percentage information of the scholarship',
        example: 'Percentage of the scholarship',
    })
    @IsString()
    @IsOptional()
    percentageInfo?: string;

    @ApiPropertyOptional({
        description: 'Is the scholarship automatically applied?',
        example: false,
    })
    @IsBoolean()
    isAutoApplied: boolean;

    @ApiProperty({
        description: 'ID of the program the scholarship applies to',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    @IsUUID()
    @IsNotEmpty()
    programId: string;
}
