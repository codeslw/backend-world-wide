import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { WebSocketDoc } from './websocket-docs';
import {
  TypingDto,
  ReadMessagesDto,
  AdminAssignedResponseDto,
  MessagesReadResponseDto,
  ChatStatusChangedResponseDto,
  ParticipantUpdateResponseDto,
  ActiveUsersResponseDto,
  UserTypingResponseDto,
  JoinChatResponseDto,
  WebSocketErrorDto,
} from './dto/websocket-event.dto';

@ApiTags('WebSockets')
@Controller('websocket-docs')
export class WebSocketDocsController {
  @Get('connect')
  @WebSocketDoc({
    summary: 'Connect to WebSocket server',
    description:
      'Connect to the WebSocket server using Socket.IO client with JWT token for authentication.',
  })
  @ApiBody({
    description: 'Connection parameters',
    schema: {
      type: 'object',
      properties: {
        auth: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT token for authentication',
            },
          },
        },
      },
      example: {
        auth: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Connected successfully' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  connect() {
    return { message: 'This is WebSocket connection documentation' };
  }

  @Get('join-chat')
  @WebSocketDoc({
    summary: 'Join a chat room',
    description:
      'Join a specific chat room to receive real-time messages and updates. Returns recent messages from the chat.',
  })
  @ApiBody({
    description: 'Chat ID (string)',
    schema: {
      type: 'string',
      example: 'chat-uuid',
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Joined chat successfully',
    type: JoinChatResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
    type: WebSocketErrorDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
    type: WebSocketErrorDto,
  })
  joinChat() {
    return { message: 'This is a WebSocket endpoint documentation' };
  }

  @Get('leave-chat')
  @WebSocketDoc({
    summary: 'Leave a chat room',
    description:
      'Leave a specific chat room to stop receiving real-time updates for that chat.',
  })
  @ApiBody({
    description: 'Chat ID (string)',
    schema: {
      type: 'string',
      example: 'chat-uuid',
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Left chat successfully',
    schema: {
      type: 'object',
      properties: {
        event: { type: 'string', example: 'leftChat' },
        data: {
          type: 'object',
          properties: {
            chatId: { type: 'string', example: 'chat-uuid' },
          },
        },
      },
    },
  })
  leaveChat() {
    return { message: 'This is a WebSocket endpoint documentation' };
  }

  @Get('send-message')
  @WebSocketDoc({
    summary: 'Send a message to a chat',
    description:
      'Send a text message, file attachment, or reply to another message within a chat.',
  })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Message sent',
    schema: {
      type: 'object',
      properties: {
        event: { type: 'string', example: 'messageSent' },
        data: { $ref: '#/components/schemas/MessageResponseDto' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
    type: WebSocketErrorDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
    type: WebSocketErrorDto,
  })
  sendMessage() {
    return { message: 'This is a WebSocket endpoint documentation' };
  }

  @Get('typing')
  @WebSocketDoc({
    summary: 'Send typing status',
    description:
      'Indicate when a user is typing or has stopped typing in a chat.',
  })
  @ApiBody({ type: TypingDto })
  @ApiResponse({ status: 200, description: 'Typing status sent' })
  typing() {
    return { message: 'This is a WebSocket endpoint documentation' };
  }

  @Get('read-messages')
  @WebSocketDoc({
    summary: 'Mark messages as read',
    description:
      'Mark one or more messages as read by the current user. Updates read receipts for all chat participants.',
  })
  @ApiBody({ type: ReadMessagesDto })
  @ApiResponse({
    status: 200,
    description: 'Messages marked as read',
    schema: {
      type: 'object',
      properties: {
        event: { type: 'string', example: 'messagesMarkedRead' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              readBy: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  readMessages() {
    return { message: 'This is a WebSocket endpoint documentation' };
  }

  @Get('get-active-users')
  @WebSocketDoc({
    summary: 'Get active users in a chat',
    description:
      'Retrieve a list of users currently active in a specific chat room.',
  })
  @ApiBody({
    description: 'Chat ID (string)',
    schema: {
      type: 'string',
      example: 'chat-uuid',
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Active users retrieved',
    type: ActiveUsersResponseDto,
  })
  getActiveUsers() {
    return { message: 'This is a WebSocket endpoint documentation' };
  }

  // Server-to-Client Event Documentation

  @Get('events/new-message')
  @WebSocketDoc({
    summary: '[Event] New message received',
    description:
      'Received when a new message is sent to a chat the client has joined.',
  })
  @ApiResponse({
    status: 200,
    description: 'New message event payload',
    type: MessageResponseDto,
  })
  newMessageEvent() {
    return { message: 'This is a WebSocket event documentation' };
  }

  @Get('events/user-typing')
  @WebSocketDoc({
    summary: '[Event] User typing status',
    description: 'Received when another user starts or stops typing in a chat.',
  })
  @ApiResponse({
    status: 200,
    description: 'User typing event payload',
    type: UserTypingResponseDto,
  })
  userTypingEvent() {
    return { message: 'This is a WebSocket event documentation' };
  }

  @Get('events/messages-read')
  @WebSocketDoc({
    summary: '[Event] Messages read by user',
    description: 'Received when messages are marked as read by another user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages read event payload',
    type: MessagesReadResponseDto,
  })
  messagesReadEvent() {
    return { message: 'This is a WebSocket event documentation' };
  }

  @Get('events/chat-status-changed')
  @WebSocketDoc({
    summary: '[Event] Chat status changed',
    description:
      'Received when the status of a chat changes (active, pending, closed).',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat status changed event payload',
    type: ChatStatusChangedResponseDto,
  })
  chatStatusChangedEvent() {
    return { message: 'This is a WebSocket event documentation' };
  }

  @Get('events/admin-assigned')
  @WebSocketDoc({
    summary: '[Event] Admin assigned to chat',
    description: 'Received when an admin is assigned to a chat.',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin assigned event payload',
    type: AdminAssignedResponseDto,
  })
  adminAssignedEvent() {
    return { message: 'This is a WebSocket event documentation' };
  }

  @Get('events/participant-update')
  @WebSocketDoc({
    summary: '[Event] Participant joined or left',
    description: 'Received when a user joins or leaves a chat room.',
  })
  @ApiResponse({
    status: 200,
    description: 'Participant update event payload',
    type: ParticipantUpdateResponseDto,
  })
  participantUpdateEvent() {
    return { message: 'This is a WebSocket event documentation' };
  }

  @Get('events/active-users')
  @WebSocketDoc({
    summary: '[Event] Active users in chat',
    description: 'Received in response to a getActiveUsers request.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active users event payload',
    type: ActiveUsersResponseDto,
  })
  activeUsersEvent() {
    return { message: 'This is a WebSocket event documentation' };
  }

  @Get('events/error')
  @WebSocketDoc({
    summary: '[Event] Error occurred',
    description: 'Received when an error occurs during WebSocket operations.',
  })
  @ApiResponse({
    status: 200,
    description: 'Error event payload',
    type: WebSocketErrorDto,
  })
  errorEvent() {
    return { message: 'This is a WebSocket event documentation' };
  }
}
