import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

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
    default: 'USD',
    required: false,
  })
  @IsString()
  @IsOptional()
  tuitionFeeCurrency?: string = 'USD';
}
