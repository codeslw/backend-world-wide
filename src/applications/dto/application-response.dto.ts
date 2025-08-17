import { ApiProperty } from '@nestjs/swagger';
import { ProfileResponseDto } from '../../profiles/dto/profile-response.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';
import { IntakeSeason, ApplicationStatus } from '@prisma/client';

export class ApplicationResponseDto {
  @ApiProperty({ description: 'Application ID' })
  id: string;

  @ApiProperty({ description: 'Profile ID associated with this application' })
  profileId: string;

  @ApiProperty({
    description: 'Profile details',
    type: ProfileResponseDto,
    required: false,
  })
  profile?: ProfileResponseDto;

  // Fields have been moved to Profile entity and are accessible via the profile property

  // University Preferences
  @ApiProperty({ description: 'Preferred country for study' })
  preferredCountry: string;

  @ApiProperty({ description: 'Preferred university ID' })
  preferredUniversityId: string;

  @ApiProperty({ description: 'Preferred university name' })
  preferredUniversityName: string;

  @ApiProperty({ description: 'Preferred country ID' })
  preferredCountryId: number;

  @ApiProperty({ description: 'Preferred country name' })
  preferredCountryName: string;

  @ApiProperty({ description: 'Preferred program ID' })
  preferredProgrammId: string;

  @ApiProperty({ description: 'Preferred program name' })
  preferredProgrammName: string;

  @ApiProperty({ enum: IntakeSeason, description: 'Preferred intake season' })
  intakeSeason: IntakeSeason;

  @ApiProperty({ description: 'Year of intended intake' })
  intakeYear: number;

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

  @ApiProperty({
    description: 'Type of program (e.g., Bachelor, Master)',
    required: false,
  })
  programType?: string;

  @ApiProperty({
    description: 'Academic year of the application',
    required: false,
  })
  academicYear?: number;

  @ApiProperty({
    description: 'General notes about the application',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'Internal notes added by admin',
    required: false,
  })
  adminNotes?: string;

  @ApiProperty({
    description: 'ID of the admin assigned to this application',
    required: false,
  })
  assignedTo?: string;

  @ApiProperty({
    description: 'Date when the application was reviewed',
    required: false,
  })
  reviewDate?: Date;
}

export class PaginatedApplicationResponseDto extends PaginatedResponseDto<ApplicationResponseDto> {
  @ApiProperty({ type: [ApplicationResponseDto] })
  data: ApplicationResponseDto[];
}
