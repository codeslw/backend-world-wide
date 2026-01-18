import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class MatchScholarshipsDto {
    @ApiProperty({ example: 3.5 })
    @IsNumber()
    @IsNotEmpty()
    gpa: number;

    @ApiProperty({ example: 'UZ' })
    @IsString()
    @IsNotEmpty()
    nationality: string;

    @ApiProperty({ example: 'Freshman' })
    @IsString()
    @IsNotEmpty()
    studentType: string;
}
