import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enum/roles.enum';
import { PaginatedResponseDto } from '../../common/dto/pagination-response.dto';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: number;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User role', enum: Role })
  role: Role;

  @ApiProperty({ description: 'User creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'User last update date' })
  updatedAt: Date;
}

export class PaginatedUserResponseDto extends PaginatedResponseDto<UserResponseDto> {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];
} 