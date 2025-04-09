import { ApiProperty } from '@nestjs/swagger';
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

export class MessageResponseDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({ description: 'Chat ID' })
  chatId: string;

  @ApiProperty({ description: 'Sender', type: UserWithProfileDto })
  sender: UserWithProfileDto;

  @ApiProperty({ description: 'Message text content', required: false })
  text?: string;

  @ApiProperty({ description: 'File URL', required: false })
  fileUrl?: string;

  @ApiProperty({ description: 'Message ID being replied to', required: false })
  replyToId?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Reply message', required: false })
  replyTo?: MessageResponseDto;
} 