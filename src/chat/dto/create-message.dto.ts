import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: 'Chat ID' })
  @IsUUID()
  chatId: string;

  @ApiProperty({ description: 'Message text content', required: false })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({ description: 'File ID to attach', required: false })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  @ApiProperty({ description: 'Message ID to reply to', required: false })
  @IsOptional()
  @IsUUID()
  replyToId?: string;
}

export class EditMessageDto {
  @ApiProperty({ description: 'Updated message text content' })
  @IsString()
  text: string;
}

export class DeleteMessageResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Deleted message ID' })
  messageId: string;
}

export class EditMessageResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Edited message ID' })
  messageId: string;

  @ApiProperty({ description: 'Updated message data' })
  message: any; // Will be MessageResponseDto
}

export class ClearChatMessagesResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Number of messages deleted' })
  deletedCount: number;

  @ApiProperty({ description: 'Response message' })
  message: string;
}
