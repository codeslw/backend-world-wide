import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ description: 'First name of the user', example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'Last name of the user', example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'Year of birth', example: 1990, required: false })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  yearOfBirth?: number;

  @ApiProperty({ description: 'Passport series and number', example: 'AB1234567', required: false })
  @IsOptional()
  @IsString()
  passportSeriesAndNumber?: string;

  @ApiProperty({ description: 'Alternative email address', example: 'john.doe@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Phone number', example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
} 