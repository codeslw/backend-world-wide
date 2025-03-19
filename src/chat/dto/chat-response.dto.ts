import { ApiProperty } from '@nestjs/swagger';
import { ChatStatus } from '../../common/enum/chat.enum';
import { MessageResponseDto } from './message-response.dto';

export class ChatResponseDto {
  @ApiProperty({ description: 'Chat ID' })
  id: string;

  @ApiProperty({ description: 'Client user ID' })
  clientId: number;

  @ApiProperty({ description: 'Admin user ID', required: false })
  adminId?: number;

  @ApiProperty({ description: 'Chat status', enum: ChatStatus })
  status: ChatStatus;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Latest messages', type: [MessageResponseDto], required: false })
  messages?: MessageResponseDto[];
} 