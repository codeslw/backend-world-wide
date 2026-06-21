import { ApiProperty } from '@nestjs/swagger';

export class ReviewFilterOptionDto {
  @ApiProperty()
  value: string;

  @ApiProperty()
  label: string;
}

export class ReviewFilterUniversityOptionDto {
  @ApiProperty()
  value: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ required: false })
  country?: string;
}

export class ReviewFilterOptionsResponseDto {
  @ApiProperty({ type: [ReviewFilterOptionDto] })
  countries: ReviewFilterOptionDto[];

  @ApiProperty({ type: [ReviewFilterOptionDto] })
  programs: ReviewFilterOptionDto[];

  @ApiProperty({ type: [ReviewFilterUniversityOptionDto] })
  universities: ReviewFilterUniversityOptionDto[];

  @ApiProperty({ type: [ReviewFilterOptionDto] })
  years: ReviewFilterOptionDto[];
}
