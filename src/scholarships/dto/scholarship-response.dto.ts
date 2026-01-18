import { ApiProperty } from '@nestjs/swagger';
import { ScholarshipLevelDto, RenewalConditionsDto, EligibilityDto } from './create-scholarship.dto';

export class ScholarshipResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    institutionName: string;

    @ApiProperty({ required: false })
    sourceUrl?: string;

    @ApiProperty({ required: false })
    amount?: string;

    @ApiProperty({ required: false })
    currency?: string;

    @ApiProperty()
    isAutoApplied: boolean;

    @ApiProperty({ type: [ScholarshipLevelDto], required: false })
    levels?: ScholarshipLevelDto[];

    @ApiProperty({ type: RenewalConditionsDto, required: false })
    renewalConditions?: RenewalConditionsDto;

    @ApiProperty({ type: EligibilityDto, required: false })
    eligibility?: EligibilityDto;

    @ApiProperty()
    universityId: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    lastUpdated: Date;
}
