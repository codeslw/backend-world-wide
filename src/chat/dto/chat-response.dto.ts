import { ApiProperty } from '@nestjs/swagger';
import { ChatStatus } from '../../common/enum/chat.enum';
import { MessageResponseDto } from './message-response.dto';
import { ProfileResponseDto } from '../../profiles/dto/profile-response.dto';

class UserWithProfileDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User role' })
  role: string;

  @ApiProperty({ description: 'User profile', type: ProfileResponseDto, required: false })
  profile?: ProfileResponseDto;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'Chat ID' })
  id: string;

  @ApiProperty({ description: 'Client user', type: UserWithProfileDto })
  client: UserWithProfileDto;

  @ApiProperty({ description: 'Admin user', type: UserWithProfileDto, required: false })
  admin?: UserWithProfileDto;

  @ApiProperty({ description: 'Chat status', enum: ChatStatus })
  status: ChatStatus;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Latest messages', type: [MessageResponseDto], required: false })
  messages?: MessageResponseDto[];
} 