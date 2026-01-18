import { ApiProperty } from '@nestjs/swagger';
import { ScholarshipType, StudyLevel } from '@prisma/client';

export class ScholarshipResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty({ type: [String] })
    requirements: string[];

    @ApiProperty()
    universityId: string;

    @ApiProperty({ required: false })
    programId?: string;

    @ApiProperty({ required: false })
    deadline?: Date;

    @ApiProperty({ enum: ScholarshipType })
    type: ScholarshipType;

    @ApiProperty({ required: false })
    minGpa?: number;

    @ApiProperty({ type: [String] })
    eligibleNationalities: string[];

    @ApiProperty({ enum: StudyLevel, isArray: true })
    studyLevels: StudyLevel[];

    @ApiProperty({ required: false })
    amount?: number;

    @ApiProperty({ required: false })
    amountCurrency?: string;

    @ApiProperty({ required: false })
    percentage?: number;

    @ApiProperty({ required: false })
    percentageInfo?: string;

    @ApiProperty()
    isAutoApplied: boolean;

    @ApiProperty({ required: false })
    amountFrom?: number;

    @ApiProperty({ required: false })
    amountTo?: number;

    @ApiProperty({ type: [String], required: false })
    amountInfo?: string[];

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
