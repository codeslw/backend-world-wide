import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsBoolean, IsArray, IsEnum, IsOptional, IsDate } from 'class-validator';
import { ChatStatus } from '../../common/enum/chat.enum';

export class TypingDto {
  @ApiProperty({ description: 'The chat ID', example: 'chat-uuid' })
  @IsUUID()
  chatId: string;

  @ApiProperty({ description: 'Whether the user is typing', example: true })
  @IsBoolean()
  isTyping: boolean;
}

export class ReadMessagesDto {
  @ApiProperty({ description: 'The chat ID', example: 'chat-uuid' })
  @IsUUID()
  chatId: string;

  @ApiProperty({ 
    description: 'Array of message IDs to mark as read', 
    example: ['message-uuid-1', 'message-uuid-2'] 
  })
  @IsArray()
  @IsUUID('4', { each: true })
  messageIds: string[];
}

export class AdminAssignedResponseDto {
  @ApiProperty({ description: 'The chat ID', example: 'chat-uuid' })
  @IsUUID()
  chatId: string;

  @ApiProperty({ description: 'The assigned admin ID', example: 'admin-uuid' })
  @IsUUID()
  adminId: string;
}

export class MessagesReadResponseDto {
  @ApiProperty({ description: 'The user ID who read the messages', example: 'user-uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ 
    description: 'Array of message IDs that were read', 
    example: ['message-uuid-1', 'message-uuid-2'] 
  })
  @IsArray()
  @IsUUID('4', { each: true })
  messageIds: string[];
}

export class ChatStatusChangedResponseDto {
  @ApiProperty({ description: 'The chat ID', example: 'chat-uuid' })
  @IsUUID()
  chatId: string;

  @ApiProperty({ 
    description: 'The new chat status', 
    enum: ChatStatus,
    example: ChatStatus.ACTIVE 
  })
  @IsEnum(ChatStatus)
  status: ChatStatus;
}

export class ParticipantActionType {
  @ApiProperty({ description: 'The action type', enum: ['joined', 'left'], example: 'joined' })
  @IsEnum(['joined', 'left'])
  action: 'joined' | 'left';
}

export class ParticipantUpdateResponseDto {
  @ApiProperty({ description: 'The chat ID', example: 'chat-uuid' })
  @IsUUID()
  chatId: string;

  @ApiProperty({ description: 'The user ID', example: 'user-uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'The action', enum: ['joined', 'left'], example: 'joined' })
  @IsEnum(['joined', 'left'])
  action: 'joined' | 'left';

  @ApiProperty({ description: 'The timestamp of the action', example: '2023-04-01T12:00:00.000Z' })
  @IsDate()
  timestamp: string;
}

export class ActiveUsersResponseDto {
  @ApiProperty({ description: 'The chat ID', example: 'chat-uuid' })
  @IsUUID()
  chatId: string;

  @ApiProperty({ 
    description: 'Array of user IDs active in the chat', 
    example: ['user-uuid-1', 'user-uuid-2'] 
  })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];
}

export class UserTypingResponseDto {
  @ApiProperty({ description: 'The user ID', example: 'user-uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'The user email', example: 'user@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Whether the user is typing', example: true })
  @IsBoolean()
  isTyping: boolean;
}

export class ChatMessageMetaDto {
  @ApiProperty({ description: 'Total number of messages', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;
}

export class ChatMessagesDto {
  @ApiProperty({ description: 'Array of messages', type: 'array', items: { type: 'object' } })
  data: any[];

  @ApiProperty({ description: 'Pagination metadata', type: ChatMessageMetaDto })
  meta: ChatMessageMetaDto;
}

export class JoinChatDataDto {
  @ApiProperty({ description: 'The chat ID', example: 'chat-uuid' })
  chatId: string;
  
  @ApiProperty({ description: 'The chat messages', type: ChatMessagesDto })
  messages: ChatMessagesDto;
}

export class JoinChatResponseDto {
  @ApiProperty({ description: 'The event name', example: 'joinedChat' })
  @IsString()
  event: string;

  @ApiProperty({ description: 'The response data', type: JoinChatDataDto })
  data: JoinChatDataDto;
}

export class WebSocketErrorDto {
  @ApiProperty({ description: 'The error message', example: 'Access denied' })
  @IsString()
  error: string;
} 