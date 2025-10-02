import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsArray,
} from 'class-validator';
import { Currency } from '../../common/enum/currency.enum';
import { StudyLevel } from '../../common/enum/study-level.enum';

export class UniversityProgramDto {
  @ApiProperty({
    description: 'The unique identifier of the program.',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsUUID()
  @IsNotEmpty()
  programId: string;

  @ApiProperty({
    description:
      'The tuition fee for this specific program at this university.',
    example: 15000.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  tuitionFee: number;

  @ApiProperty({
    description: 'The currency of the tuition fee.',
    example: 'USD',
    enum: Currency,
    default: Currency.USD,
    required: false,
  })
  @IsEnum(Currency)
  @IsOptional()
  tuitionFeeCurrency?: Currency = Currency.USD;

  @ApiProperty({
    description: 'The study level for this program at this university.',
    example: StudyLevel.BACHELOR,
    enum: StudyLevel,
  })
  @IsEnum(StudyLevel)
  @IsNotEmpty()
  studyLevel: StudyLevel;

  @ApiProperty({
    description: 'The duration of the program in months.',
    example: 24,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiProperty({
    description: 'The intakes for this program.',
    example: ['d290f1ee-6c54-4b01-90e6-d701748f0851'],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  intakes?: string[];
}
