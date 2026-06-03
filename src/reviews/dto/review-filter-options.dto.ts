import { ApiProperty } from '@nestjs/swagger';

export class ReviewFilterOptionDto {
  @ApiProperty()
  value: string;

  @ApiProperty()
  label: string;
}

export class ReviewFilterOptionsResponseDto {
  @ApiProperty({ type: [ReviewFilterOptionDto] })
  countries: ReviewFilterOptionDto[];

  @ApiProperty({ type: [ReviewFilterOptionDto] })
  programs: ReviewFilterOptionDto[];

  @ApiProperty({ type: [ReviewFilterOptionDto] })
  years: ReviewFilterOptionDto[];
}
