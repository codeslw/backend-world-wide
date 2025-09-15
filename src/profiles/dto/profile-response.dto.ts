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

  @ApiPropertyOptional({ description: 'First name of the user' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name of the user' })
  lastName?: string;

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
    description: 'File GUID for the uploaded passport copy',
  })
  passportCopyGuid?: string;

  // @ApiPropertyOptional({ description: 'Year of birth' })
  // yearOfBirth?: number;

  @ApiPropertyOptional({ description: 'Passport series and number' })
  passportSeriesAndNumber?: string;

  @ApiPropertyOptional({ description: 'Alternative email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'File GUID for uploaded motivation letter',
  })
  motivationLetterGuid?: string;

  @ApiPropertyOptional({
    description: 'File GUIDs for uploaded recommendation letters',
    type: [String],
  })
  recommendationLetterGuids?: string[];

  @ApiPropertyOptional({ description: 'File GUID for uploaded CV' })
  cvGuid?: string;

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
