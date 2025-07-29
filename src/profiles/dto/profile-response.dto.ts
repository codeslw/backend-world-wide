import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';
import { EducationDto } from './education.dto';
import { LanguageCertificateDto } from './language-certificate.dto';
import { StandardizedTestDto } from './standardized-test.dto';

export class ProfileResponseDto {
  @ApiProperty({ description: 'Profile ID' })
  id: string;

  @ApiProperty({ description: 'User ID associated with this profile' })
  userId: string;

  @ApiProperty({ description: 'First name of the user' })
  firstName: string;

  @ApiProperty({ description: 'Last name of the user' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Middle name of the user' })
  middleName?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  dateOfBirth?: Date;

  @ApiPropertyOptional({
    enum: Gender,
    description: 'Gender of the user',
  })
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Nationality of the user' })
  nationality?: string;

  @ApiPropertyOptional({ description: 'Full address of the user' })
  address?: string;

  @ApiPropertyOptional({ description: 'Passport expiry date' })
  passportExpiryDate?: Date;

  @ApiPropertyOptional({
    description: 'URL to the uploaded passport copy',
  })
  passportCopyUrl?: string;

  @ApiPropertyOptional({ description: 'Year of birth' })
  yearOfBirth?: number;

  @ApiPropertyOptional({ description: 'Passport series and number' })
  passportSeriesAndNumber?: string;

  @ApiPropertyOptional({ description: 'Alternative email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'URL to uploaded motivation letter',
  })
  motivationLetterUrl?: string;

  @ApiPropertyOptional({
    description: 'URLs to uploaded recommendation letters',
    type: [String],
  })
  recommendationLetterUrls?: string[];

  @ApiPropertyOptional({ description: 'URL to uploaded CV' })
  cvUrl?: string;

  @ApiProperty({ description: 'Profile creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Profile last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({
    type: () => [EducationDto],
    description: 'List of educational qualifications',
  })
  educationHistory?: EducationDto[];

  @ApiPropertyOptional({
    type: () => [LanguageCertificateDto],
    description: 'List of language certificates',
  })
  languageCertificates?: LanguageCertificateDto[];

  @ApiPropertyOptional({
    type: () => [StandardizedTestDto],
    description: 'List of standardized test scores',
  })
  standardizedTests?: StandardizedTestDto[];
}

export class PaginatedProfileResponseDto extends PaginatedResponseDto<ProfileResponseDto> {
  @ApiProperty({ type: [ProfileResponseDto] })
  data: ProfileResponseDto[];
}
