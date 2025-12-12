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

    @ApiProperty()
    amount: number;

    @ApiProperty()
    amountCurrency: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
