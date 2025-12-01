import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ScholarshipProgramFilterDto {
    @ApiPropertyOptional({
        description: 'Filter by university ID',
    })
    @IsUUID()
    @IsOptional()
    universityId?: string;

    @ApiPropertyOptional({
        description: 'Search term for scholarship name or description',
    })
    @IsString()
    @IsOptional()
    search?: string;
}
