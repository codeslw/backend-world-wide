import { ApiProperty } from '@nestjs/swagger';

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

    @ApiProperty()
    programId: string;

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
