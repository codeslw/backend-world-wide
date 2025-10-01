import { ApiProperty } from '@nestjs/swagger';
import { CountryResponseDto } from '../../countries/dto/country-response.dto';
import { CityResponseDto } from '../../cities/dto/city-response.dto';
import { Currency } from '../../common/enum/currency.enum';
import { StudyLevel } from '../../common/enum/study-level.enum';

class MainUniversityProgramDto {
  @ApiProperty({ description: 'Program ID' })
  programId: string;

  @ApiProperty({ description: 'Program title' })
  title: string;

  @ApiProperty({ description: 'Tuition fee' })
  tuitionFee: number;

  @ApiProperty({ description: 'Tuition fee currency', enum: Currency })
  tuitionFeeCurrency: Currency;

  @ApiProperty({ description: 'Study level', enum: StudyLevel })
  studyLevel: StudyLevel;
}

export class MainUniversityResponseDto {
  @ApiProperty({ description: 'University name' })
  name: string;

  @ApiProperty({ description: 'Country details' })
  country: CountryResponseDto;

  @ApiProperty({ description: 'City details' })
  city: CityResponseDto;

  @ApiProperty({ description: 'Programs offered', type: [MainUniversityProgramDto] })
  programs: MainUniversityProgramDto[];

  @ApiProperty({ description: 'University ranking' })
  ranking?: number;

  @ApiProperty({ description: 'Year of establishment' })
  established?: number;

  @ApiProperty({ description: 'University photo URL' })
  photoUrl?: string;
}
