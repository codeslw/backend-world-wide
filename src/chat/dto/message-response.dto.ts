import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({ description: 'Chat ID' })
  chatId: string;

  @ApiProperty({ description: 'Sender user ID' })
  senderId: number;

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