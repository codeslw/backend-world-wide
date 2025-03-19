import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { WebSocketDoc } from './websocket-docs';

@ApiTags('WebSockets')
@Controller('websocket-docs')
export class WebSocketDocsController {
  @Get('join-chat')
  @WebSocketDoc({ summary: 'Join a chat room' })
  @ApiBody({ description: 'Chat ID (string)', type: String })
  @ApiResponse({ status: 200, description: 'Joined chat successfully' })
  joinChat() {
    return { message: 'This is a WebSocket endpoint documentation' };
  }

  @Get('send-message')
  @WebSocketDoc({ summary: 'Send a message to a chat' })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({ status: 200, description: 'Message sent', type: MessageResponseDto })
  sendMessage() {
    return { message: 'This is a WebSocket endpoint documentation' };
  }

  // Add other WebSocket endpoints documentation
} 