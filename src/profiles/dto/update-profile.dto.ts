import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, Min, Max, IsDateString, IsEnum, IsUrl } from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdateProfileDto {
  @ApiProperty({ description: 'First name of the user', example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'Last name of the user', example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'Middle name of the user', example: 'Michael', required: false })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ description: 'Date of birth in ISO format', example: '1990-01-01', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ enum: Gender, description: 'Gender of the user', required: false })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ description: 'Nationality of the user', example: 'American', required: false })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiProperty({ description: 'Full address of the user', example: '123 Main St, Anytown, USA', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Passport number', example: 'X12345678', required: false })
  @IsOptional()
  @IsString()
  passportNumber?: string;

  @ApiProperty({ description: 'Passport expiry date in ISO format', example: '2030-01-01', required: false })
  @IsOptional()
  @IsDateString()
  passportExpiryDate?: string;

  @ApiProperty({ description: 'URL to the uploaded passport copy', example: 'https://example.com/passport.jpg', required: false })
  @IsOptional()
  @IsString()
  @IsUrl()
  passportCopyUrl?: string;

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