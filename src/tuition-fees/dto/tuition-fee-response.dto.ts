import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';

export class TuitionFeeResponseDto {
  @ApiProperty({ description: 'Tuition fee ID' })
  id: number;

  @ApiProperty({ description: 'Minimum tuition fee amount' })
  minAmount: number;

  @ApiProperty({ description: 'Maximum tuition fee amount' })
  maxAmount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class PaginatedTuitionFeeResponseDto extends PaginatedResponseDto<TuitionFeeResponseDto> {
  @ApiProperty({ type: [TuitionFeeResponseDto] })
  data: TuitionFeeResponseDto[];
} 