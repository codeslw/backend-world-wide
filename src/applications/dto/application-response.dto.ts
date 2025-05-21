import { ApiProperty } from '@nestjs/swagger';
import { ProfileResponseDto } from '../../profiles/dto/profile-response.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';
import { LanguageTest, IntakeSeason, ApplicationStatus } from '@prisma/client';

export class ApplicationResponseDto {
  @ApiProperty({ description: 'Application ID' })
  id: string;

  @ApiProperty({ description: 'Profile ID associated with this application' })
  profileId: string;

  @ApiProperty({ description: 'Profile details', type: ProfileResponseDto })
  profile: ProfileResponseDto;

  @ApiProperty({ description: 'Current education level' })
  currentEducationLevel: string;

  @ApiProperty({
    description: 'Name of current educational institution',
    required: false,
  })
  currentInstitutionName?: string;

  @ApiProperty({ description: 'Year of graduation', required: false })
  graduationYear?: number;

  @ApiProperty({
    description: 'URL to the uploaded transcript',
    required: false,
  })
  transcriptUrl?: string;

  @ApiProperty({
    enum: LanguageTest,
    description: 'Type of language test taken',
    required: false,
  })
  languageTest?: LanguageTest;

  @ApiProperty({ description: 'Score of language test', required: false })
  languageScore?: string;

  @ApiProperty({
    description: 'URL to the uploaded language certificate',
    required: false,
  })
  languageCertificateUrl?: string;

  @ApiProperty({ description: 'Preferred country for study' })
  preferredCountry: string;

  @ApiProperty({ description: 'Preferred university for study' })
  preferredUniversity: string;

  @ApiProperty({ description: 'Preferred program of study' })
  preferredProgram: string;

  @ApiProperty({ enum: IntakeSeason, description: 'Preferred intake season' })
  intakeSeason: IntakeSeason;

  @ApiProperty({ description: 'Year of intended intake' })
  intakeYear: number;

  @ApiProperty({
    description: 'URL to the uploaded motivation letter',
    required: false,
  })
  motivationLetterUrl?: string;

  @ApiProperty({
    description: 'URLs to the uploaded recommendation letters',
    type: [String],
    required: false,
  })
  recommendationLetterUrls?: string[];

  @ApiProperty({ description: 'URL to the uploaded CV', required: false })
  cvUrl?: string;

  @ApiProperty({
    enum: ApplicationStatus,
    description: 'Status of the application',
  })
  applicationStatus: ApplicationStatus;

  @ApiProperty({ description: 'Submission date', required: false })
  submittedAt?: Date;

  @ApiProperty({ description: 'Application creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Application last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'ID of the specific program applied for', required: false })
  programId?: string;

  @ApiProperty({ description: 'Type of program (e.g., Bachelor, Master)', required: false })
  programType?: string;

  @ApiProperty({ description: 'Academic year of the application', required: false })
  academicYear?: number;

  @ApiProperty({ description: 'General notes about the application', required: false })
  notes?: string;

  @ApiProperty({ description: 'Internal notes added by admin', required: false })
  adminNotes?: string;

  @ApiProperty({ description: 'ID of the admin assigned to this application', required: false })
  assignedTo?: string;

  @ApiProperty({ description: 'Date when the application was reviewed', required: false })
  reviewDate?: Date;
}

export class PaginatedApplicationResponseDto extends PaginatedResponseDto<ApplicationResponseDto> {
  @ApiProperty({ type: [ApplicationResponseDto] })
  data: ApplicationResponseDto[];
}
