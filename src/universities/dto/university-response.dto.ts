import { ApiProperty } from '@nestjs/swagger';
import { UniversityType } from 'src/common/enum/university-type.enum';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';

export class UniversityResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nameUz: string;

  @ApiProperty()
  nameRu: string;

  @ApiProperty()
  nameEn: string;

  @ApiProperty()
  established: number;

  @ApiProperty({ enum: UniversityType })
  type: UniversityType;

  @ApiProperty()
  avgApplicationFee: number;

  @ApiProperty()
  countryId: string;

  @ApiProperty()
  cityId: string;

  @ApiProperty()
  descriptionUz: string;

  @ApiProperty()
  descriptionRu: string;

  @ApiProperty()
  descriptionEn: string;

  @ApiProperty({ required: false })
  winterIntakeDeadline?: Date;

  @ApiProperty({ required: false })
  autumnIntakeDeadline?: Date;

  @ApiProperty()
  ranking: number;

  @ApiProperty()
  studentsCount: number;

  @ApiProperty()
  acceptanceRate: number;

  @ApiProperty()
  website: string;

  @ApiProperty()
  tuitionFeeMin: number;

  @ApiProperty()
  tuitionFeeMax: number;

  @ApiProperty()
  tuitionFeeCurrency: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedUniversityResponseDto extends PaginatedResponseDto<UniversityResponseDto> {
  @ApiProperty({ type: [UniversityResponseDto] })
  data: UniversityResponseDto[];
} 