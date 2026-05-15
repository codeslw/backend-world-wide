import { ApiProperty } from '@nestjs/swagger';
import { CountryResponseDto } from '../../countries/dto/country-response.dto';
import { CityResponseDto } from '../../cities/dto/city-response.dto';
import { Currency } from '../../common/enum/currency.enum';
import { StudyLevel } from '../../common/enum/study-level.enum';
import { IntakeResponseDto } from './intake-response.dto';

class MainUniversityProgramDto {
  @ApiProperty({ description: 'Program ID' })
  programId: string;

  @ApiProperty({ description: 'Program title' })
  title: string;

  @ApiProperty({ description: 'Tuition fee' })
  tuitionFee: number;

  @ApiProperty({ description: 'Tuition fee type' })
  tuitionFeeType: string;

  @ApiProperty({ description: 'Tuition fee currency', enum: Currency })
  tuitionFeeCurrency: Currency;

  @ApiProperty({ description: 'Study level', enum: StudyLevel })
  studyLevel: StudyLevel;

  @ApiProperty({ description: 'Available intakes', type: [IntakeResponseDto] })
  intakes: IntakeResponseDto[];
}

export class MainUniversityResponseDto {
  @ApiProperty({ description: 'Id of university' })
  id: string;

  @ApiProperty({ description: 'University name' })
  name: string;

  @ApiProperty({ description: 'Country details' })
  country: CountryResponseDto;

  @ApiProperty({ description: 'City details' })
  city: CityResponseDto;

  @ApiProperty({
    description: 'Programs offered',
    type: [MainUniversityProgramDto],
  })
  programs: MainUniversityProgramDto[];

  @ApiProperty({ description: 'University ranking' })
  ranking?: number;

  @ApiProperty({ description: 'Year of establishment' })
  established?: number;

  @ApiProperty({ description: 'University photo URL' })
  photoUrl?: string;

  @ApiProperty({ description: 'University logo URL' })
  logoUrl?: string;

  @ApiProperty({ description: 'University type (PUBLIC or PRIVATE)' })
  type?: string;

  @ApiProperty({ description: 'Average application fee' })
  avgApplicationFee?: number;

  @ApiProperty({ description: 'Application fee currency' })
  applicationFeeCurrency?: string;

  @ApiProperty({ description: 'Whether admission fee is refundable' })
  isAdmissionFeeRefundable?: boolean;

  @ApiProperty({ description: 'Whether scholarships are available' })
  hasScholarship?: boolean;

  @ApiProperty({ description: 'Number of bachelor programs' })
  bachelorCount?: number;

  @ApiProperty({ description: 'Number of master programs' })
  masterCount?: number;

  @ApiProperty({ description: 'Number of PhD programs' })
  phdCount?: number;

  @ApiProperty({ description: 'Minimum tuition fee across programs' })
  minTuitionFee?: number;

  @ApiProperty({ description: 'Maximum tuition fee across programs' })
  maxTuitionFee?: number;

  @ApiProperty({ description: 'Tuition fee currency' })
  tuitionFeeCurrency?: string;
}
