import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
        description: 'ID of the program the scholarship applies to',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    @IsUUID()
    @IsNotEmpty()
    programId: string;
}
