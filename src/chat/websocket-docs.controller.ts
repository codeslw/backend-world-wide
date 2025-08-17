import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Define Role enum inline since we can't find the external one
enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  PARTNER = 'PARTNER',
}

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

  @Get('delete-message')
  @WebSocketDoc({
    summary: 'Delete a message from a chat',
    description:
      'Delete a specific message from a chat. Users can delete their own messages, admins can delete any message in their assigned chats.',
  })
  @ApiBody({
    description: 'Message deletion payload',
    schema: {
      type: 'object',
      properties: {
        messageId: {
          type: 'string',
          description: 'ID of the message to delete',
          example: 'message-uuid',
        },
      },
      required: ['messageId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        messageId: { type: 'string', example: 'message-uuid' },
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
    description: 'Message not found',
    type: WebSocketErrorDto,
  })
  deleteMessage() {
    return { message: 'This is a WebSocket endpoint documentation' };
  }

  @Get('clear-chat-messages')
  @WebSocketDoc({
    summary: 'Clear all messages from a chat',
    description:
      'Delete all messages from a chat. Only assigned admins can perform this action.',
  })
  @ApiBody({
    description: 'Chat clear payload',
    schema: {
      type: 'object',
      properties: {
        chatId: {
          type: 'string',
          description: 'ID of the chat to clear',
          example: 'chat-uuid',
        },
      },
      required: ['chatId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Chat messages cleared successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        deletedCount: { type: 'number', example: 25 },
        message: {
          type: 'string',
          example: 'Successfully deleted 25 messages',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - only assigned admins can clear chats',
    type: WebSocketErrorDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
    type: WebSocketErrorDto,
  })
  clearChatMessages() {
    return { message: 'This is a WebSocket endpoint documentation' };
  }

  @Get('edit-message')
  @WebSocketDoc({
    summary: 'Edit a message in a chat',
    description:
      'Edit the text content of a message. Users can edit their own messages within 15 minutes of sending. Admins can edit any message in their assigned chats. Cannot edit messages with replies or file attachments.',
  })
  @ApiBody({
    description: 'Message edit payload',
    schema: {
      type: 'object',
      properties: {
        messageId: {
          type: 'string',
          description: 'ID of the message to edit',
          example: 'message-uuid',
        },
        text: {
          type: 'string',
          description: 'New text content for the message',
          example: 'Updated message content',
        },
      },
      required: ['messageId', 'text'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Message edited successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        messageId: { type: 'string', example: 'message-uuid' },
        message: {
          type: 'object',
          description: 'Updated message data',
          properties: {
            id: { type: 'string' },
            text: { type: 'string' },
            isEdited: { type: 'boolean', example: true },
            editedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description:
      'Access denied or business rule violation (time limit, has replies, etc.)',
    type: WebSocketErrorDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
    type: WebSocketErrorDto,
  })
  editMessage() {
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

  @Get('update-message-status')
  @WebSocketDoc({
    summary: 'Update message status',
    description:
      'Update the status of a message (SENDING | SENT | DELIVERED | READ). Used to track message delivery and read receipts.',
  })
  @ApiBody({
    description: 'Message status update payload',
    schema: {
      type: 'object',
      properties: {
        messageId: {
          type: 'string',
          description: 'ID of the message to update',
          example: 'message-uuid',
        },
        status: {
          type: 'string',
          enum: ['SENDING', 'SENT', 'DELIVERED', 'READ'],
          description: 'New status for the message',
          example: 'DELIVERED',
        },
      },
      required: ['messageId', 'status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Message status updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'object',
          description: 'Updated message data',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', example: 'DELIVERED' },
          },
        },
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
    description: 'Message not found',
    type: WebSocketErrorDto,
  })
  updateMessageStatus() {
    return { message: 'This is a WebSocket endpoint documentation' };
  }

  @Get('delete-chat')
  @WebSocketDoc({
    summary: 'Delete a chat',
    description:
      'Delete an entire chat and all its messages. Only chat owners (clients) or assigned admins can delete chats.',
  })
  @ApiBody({
    description: 'Chat deletion payload',
    schema: {
      type: 'object',
      properties: {
        chatId: {
          type: 'string',
          description: 'ID of the chat to delete',
          example: 'chat-uuid',
        },
      },
      required: ['chatId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Chat deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Chat deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - only chat owner or assigned admin can delete',
    type: WebSocketErrorDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
    type: WebSocketErrorDto,
  })
  deleteChat() {
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

  @Get('events/message-deleted')
  @WebSocketDoc({
    summary: '[Event] Message deleted',
    description: 'Received when a message is deleted from a chat.',
  })
  @ApiResponse({
    status: 200,
    description: 'Message deleted event payload',
    schema: {
      type: 'object',
      properties: {
        messageId: {
          type: 'string',
          description: 'ID of the deleted message',
          example: 'message-uuid',
        },
        chatId: {
          type: 'string',
          description: 'ID of the chat where message was deleted',
          example: 'chat-uuid',
        },
        deletedBy: {
          type: 'string',
          description: 'ID of the user who deleted the message',
          example: 'user-uuid',
        },
      },
    },
  })
  messageDeletedEvent() {
    return { message: 'This is a WebSocket event documentation' };
  }

  @Get('events/chat-cleared')
  @WebSocketDoc({
    summary: '[Event] Chat messages cleared',
    description:
      'Received when all messages in a chat are cleared by an admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat cleared event payload',
    schema: {
      type: 'object',
      properties: {
        chatId: {
          type: 'string',
          description: 'ID of the chat that was cleared',
          example: 'chat-uuid',
        },
        clearedBy: {
          type: 'string',
          description: 'ID of the admin who cleared the chat',
          example: 'admin-user-uuid',
        },
        deletedCount: {
          type: 'number',
          description: 'Number of messages that were deleted',
          example: 25,
        },
      },
    },
  })
  chatClearedEvent() {
    return { message: 'This is a WebSocket event documentation' };
  }

  @Get('events/message-edited')
  @WebSocketDoc({
    summary: '[Event] Message edited',
    description: 'Received when a message is edited in a chat.',
  })
  @ApiResponse({
    status: 200,
    description: 'Message edited event payload',
    schema: {
      type: 'object',
      properties: {
        messageId: {
          type: 'string',
          description: 'ID of the edited message',
          example: 'message-uuid',
        },
        chatId: {
          type: 'string',
          description: 'ID of the chat where message was edited',
          example: 'chat-uuid',
        },
        editedBy: {
          type: 'string',
          description: 'ID of the user who edited the message',
          example: 'user-uuid',
        },
        message: {
          type: 'object',
          description: 'Updated message data with editing information',
          properties: {
            id: { type: 'string' },
            text: { type: 'string' },
            isEdited: { type: 'boolean', example: true },
            editedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  messageEditedEvent() {
    return { message: 'This is a WebSocket event documentation' };
  }

  @Get('events/message-status-updated')
  @WebSocketDoc({
    summary: '[Event] Message status updated',
    description:
      'Received when a message status is updated (SENDING | SENT | DELIVERED | READ).',
  })
  @ApiResponse({
    status: 200,
    description: 'Message status updated event payload',
    schema: {
      type: 'object',
      properties: {
        messageId: {
          type: 'string',
          description: 'ID of the message with updated status',
          example: 'message-uuid',
        },
        chatId: {
          type: 'string',
          description: 'ID of the chat containing the message',
          example: 'chat-uuid',
        },
        status: {
          type: 'string',
          enum: ['SENDING', 'SENT', 'DELIVERED', 'READ'],
          description: 'New status of the message',
          example: 'DELIVERED',
        },
        message: {
          type: 'object',
          description: 'Updated message data with new status',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
          },
        },
      },
    },
  })
  messageStatusUpdatedEvent() {
    return { message: 'This is a WebSocket event documentation' };
  }

  @Get('events/chat-deleted')
  @WebSocketDoc({
    summary: '[Event] Chat deleted',
    description:
      'Received when an entire chat is deleted by its owner or assigned admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat deleted event payload',
    schema: {
      type: 'object',
      properties: {
        chatId: {
          type: 'string',
          description: 'ID of the deleted chat',
          example: 'chat-uuid',
        },
        deletedBy: {
          type: 'string',
          description: 'ID of the user who deleted the chat',
          example: 'user-uuid',
        },
      },
    },
  })
  chatDeletedEvent() {
    return { message: 'This is a WebSocket event documentation' };
  }

  @Get('debug/ws-auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Debug WebSocket authentication' })
  async debugWebSocketAuth(@Request() req) {
    return {
      user: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
      timestamp: new Date().toISOString(),
      message: 'Use this token for WebSocket authentication',
    };
  }

  @Get('debug/active-connections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Debug active WebSocket connections (Admin only)' })
  async debugActiveConnections() {
    // Access the ChatGateway instance to get connection info
    // Note: This requires the gateway to be properly injected
    return {
      message: 'Check server logs for detailed connection information',
      timestamp: new Date().toISOString(),
    };
  }
}
