import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ChatStatus } from '../../common/enum/chat.enum';

export class UpdateChatStatusDto {
  @ApiProperty({ 
    description: 'Chat status', 
    enum: ChatStatus,
    example: 'CLOSED'
  })
  @IsEnum(ChatStatus)
  status: ChatStatus;
} 