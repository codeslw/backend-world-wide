import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateMiniApplicationDto {
  @ApiProperty({
    example: 'John',
    description: 'First name of the applicant',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the applicant',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the applicant',
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number of the applicant (including country code)',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      'PhoneNumber must be a valid E.164 phone number (e.g., +1234567890)',
  })
  phoneNumber: string;
}
