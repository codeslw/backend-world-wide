import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';

export class ProfileResponseDto {
  @ApiProperty({ description: 'Profile ID' })
  id: string;

  @ApiProperty({ description: 'User ID associated with this profile' })
  userId: string;
  
  @ApiProperty({ description: 'First name of the user' })
  firstName: string;

  @ApiProperty({ description: 'Last name of the user' })
  lastName: string;

  @ApiProperty({ description: 'Year of birth', required: false })
  yearOfBirth?: number;

  @ApiProperty({ description: 'Passport series and number', required: false })
  passportSeriesAndNumber?: string;

  @ApiProperty({ description: 'Alternative email address', required: false })
  email?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  phoneNumber?: string;

  @ApiProperty({ description: 'Profile creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Profile last update date' })
  updatedAt: Date;
}

export class PaginatedProfileResponseDto extends PaginatedResponseDto<ProfileResponseDto> {
  @ApiProperty({ type: [ProfileResponseDto] })
  data: ProfileResponseDto[];
} 