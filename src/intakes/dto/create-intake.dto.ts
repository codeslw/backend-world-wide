import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsString } from 'class-validator';

export class CreateIntakeDto {
  @ApiProperty()
  @IsString()
  month: string;

  @ApiProperty()
  @IsInt()
  year: number;

  @ApiProperty()
  @IsDateString()
  deadline: Date;
}
