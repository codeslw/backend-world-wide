import { ApiProperty } from '@nestjs/swagger';
import { UniversityType } from '../../common/enum/university-type.enum';
import { Currency } from '../../common/enum/currency.enum';

export class UniversityListItemDto {
    @ApiProperty({ description: 'University ID' })
    id: string;

    @ApiProperty({ description: 'University name' })
    name: string;

    @ApiProperty({ description: 'Year of establishment' })
    established: number;

    @ApiProperty({ enum: UniversityType, description: 'Type of university' })
    type: string;

    @ApiProperty({ description: 'Average application fee' })
    avgApplicationFee: number;

    @ApiProperty({ enum: Currency, description: 'Application fee currency' })
    applicationFeeCurrency: string;

    @ApiProperty({ description: 'University ranking' })
    ranking: number;

    @ApiProperty({ description: 'University photo URL' })
    photoUrl: string;

    @ApiProperty({ description: 'Whether this university is featured as main' })
    isMain: boolean;

    @ApiProperty({ description: 'Country name' })
    countryName: string;

    @ApiProperty({ description: 'City name' })
    cityName: string;

    @ApiProperty({ description: 'Minimum tuition fee' })
    minTuitionFee: number;

    @ApiProperty({ description: 'Maximum tuition fee' })
    maxTuitionFee: number;

    @ApiProperty({ enum: Currency, description: 'Tuition fee currency' })
    tuitionFeeCurrency: string;

    @ApiProperty({ description: 'Count of bachelor programs' })
    bachelorCount: number;

    @ApiProperty({ description: 'Count of master programs' })
    masterCount: number;

    @ApiProperty({ description: 'Count of PhD programs' })
    phdCount: number;

    @ApiProperty({ description: 'Whether this university has a scholarship' })
    hasScholarship: boolean;
}

import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';

export class PaginatedUniversityListItemResponseDto extends PaginatedResponseDto<UniversityListItemDto> {
    @ApiProperty({ type: [UniversityListItemDto] })
    data: UniversityListItemDto[];
}
