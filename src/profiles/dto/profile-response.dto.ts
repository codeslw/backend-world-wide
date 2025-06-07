import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';
import { Gender, LanguageTest } from '@prisma/client';

export class ProfileResponseDto {
  @ApiProperty({ description: 'Profile ID' })
  id: string;

  @ApiProperty({ description: 'User ID associated with this profile' })
  userId: string;

  @ApiProperty({ description: 'First name of the user' })
  firstName: string;

  @ApiProperty({ description: 'Last name of the user' })
  lastName: string;

  @ApiProperty({ description: 'Middle name of the user', required: false })
  middleName?: string;

  @ApiProperty({ description: 'Date of birth', required: false })
  dateOfBirth?: Date;

  @ApiProperty({
    enum: Gender,
    description: 'Gender of the user',
    required: false,
  })
  gender?: Gender;

  @ApiProperty({ description: 'Nationality of the user', required: false })
  nationality?: string;

  @ApiProperty({ description: 'Full address of the user', required: false })
  address?: string;

  @ApiProperty({ description: 'Passport number', required: false })
  passportNumber?: string;

  @ApiProperty({ description: 'Passport expiry date', required: false })
  passportExpiryDate?: Date;

  @ApiProperty({
    description: 'URL to the uploaded passport copy',
    required: false,
  })
  passportCopyUrl?: string;

  @ApiProperty({ description: 'Year of birth', required: false })
  yearOfBirth?: number;

  @ApiProperty({ description: 'Passport series and number', required: false })
  passportSeriesAndNumber?: string;

  @ApiProperty({ description: 'Alternative email address', required: false })
  email?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  phoneNumber?: string;

  @ApiProperty({ description: 'Current education level', required: false })
  currentEducationLevel?: string;

  @ApiProperty({
    description: 'Current educational institution name',
    required: false,
  })
  currentInstitutionName?: string;

  @ApiProperty({ description: 'Graduation year', required: false })
  graduationYear?: number;

  @ApiProperty({
    description: 'URL to uploaded transcript document',
    required: false,
  })
  transcriptUrl?: string;

  @ApiProperty({
    enum: LanguageTest,
    description: 'Language test type',
    required: false,
  })
  languageTest?: LanguageTest;

  @ApiProperty({ description: 'Language test score', required: false })
  languageScore?: string;

  @ApiProperty({
    description: 'URL to uploaded language certificate',
    required: false,
  })
  languageCertificateUrl?: string;

  @ApiProperty({
    description: 'URL to uploaded motivation letter',
    required: false,
  })
  motivationLetterUrl?: string;

  @ApiProperty({
    description: 'URLs to uploaded recommendation letters',
    type: [String],
    required: false,
  })
  recommendationLetterUrls?: string[];

  @ApiProperty({ description: 'URL to uploaded CV', required: false })
  cvUrl?: string;

  @ApiProperty({ description: 'Profile creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Profile last update date' })
  updatedAt: Date;
}

export class PaginatedProfileResponseDto extends PaginatedResponseDto<ProfileResponseDto> {
  @ApiProperty({ type: [ProfileResponseDto] })
  data: ProfileResponseDto[];
}
