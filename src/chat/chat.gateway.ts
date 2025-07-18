import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsResponse,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, UseGuards, forwardRef } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../db/prisma.service';
import {
  ChatService,
  MessageWithSender,
  PartialAdminInfo,
} from './chat.service';
import {
  Role as PrismaRole,
  ChatStatus as PrismaChatStatus,
} from '@prisma/client';
import {
  JoinChatAckResponse,
  LeaveChatAckResponse,
  SendMessageAckResponse,
  ReadMessagesAckResponse,
  GetActiveUsersAckResponse,
  DeleteMessageAckResponse,
  EditMessageAckResponse,
  ClearChatMessagesAckResponse,
} from './types/websocket-responses';

interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    email: string;
    role: PrismaRole;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict this to your frontend domain
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  // Store active connections by user ID and chat ID
  private userSockets: Map<string, Set<string>> = new Map();
  private chatRooms: Map<string, Set<string>> = new Map();
  // Define the admin room name
  private readonly adminRoom = 'admins';

  constructor(
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
    // Ensure the service knows about the gateway if using setChatGateway approach
    // This depends on your module setup (forwardRef vs. onModuleInit)
    if (
      this.chatService &&
      typeof (this.chatService as any).setChatGateway === 'function'
    ) {
      (this.chatService as any).setChatGateway(this);
    }
  }

  async handleConnection(client: Socket) {
    try {
      console.log(`[WebSocket] New connection attempt: ${client.id}`);
      
      // Extract and verify JWT token
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        console.error(`[WebSocket] No token provided for connection ${client.id}`);
        client.disconnect();
        return;
      }

      console.log(`[WebSocket] Token found, verifying for connection ${client.id}`);
      const payload = this.jwtService.verify(token);
      
      console.log(`[WebSocket] Token verified, fetching user ${payload.sub}`);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        console.error(`[WebSocket] User ${payload.sub} not found in database`);
        client.disconnect();
        return;
      }

      // Attach user data to socket
      const authSocket = client as AuthenticatedSocket;
      authSocket.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      // Store socket connection
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)!.add(client.id);

      console.log(
        `[WebSocket] Client connected successfully: ${client.id}, User: ${user.id}, Role: ${user.role}`,
      );

      // Join admin room if applicable
      if (user.role === PrismaRole.ADMIN) {
        client.join(this.adminRoom);
        console.log(`[WebSocket] Admin ${user.id} joined room: ${this.adminRoom}`);
      }

      client.emit('connected', { userId: user.id }); // Confirm connection to client
    } catch (error) {
      console.error(`[WebSocket] Connection error for ${client.id}:`, {
        error: error.message,
        stack: error.stack,
        headers: client.handshake.headers,
        auth: client.handshake.auth,
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = (client as AuthenticatedSocket).user;

    if (user) {
      // Remove socket from user's connections
      const userSockets = this.userSockets.get(user.id);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(user.id);
        }
      }

      // Remove user from chat rooms
      this.chatRooms.forEach((users, chatId) => {
        if (users.has(user.id)) {
          users.delete(user.id);
          if (users.size === 0) {
            this.chatRooms.delete(chatId);
          }
        }
      });
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() chatId: string,
  ): Promise<JoinChatAckResponse> {
    try {
      const userId = client.user.id;
      const userRole = client.user.role;

      console.log(`[WebSocket] User ${userId} (${userRole}) attempting to join chat ${chatId}`);

      // Validate chatId parameter
      if (!chatId || typeof chatId !== 'string') {
        console.error(`[WebSocket] Invalid chatId provided:`, chatId);
        throw new Error('Invalid chat ID');
      }

      // Verify user has access to this chat
      console.log(`[WebSocket] Fetching chat ${chatId} from database...`);
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          client: { select: { id: true, email: true, role: true } },
          admin: { select: { id: true, email: true, role: true } },
        },
      });

      if (!chat) {
        console.error(`[WebSocket] Chat ${chatId} not found in database`);
        throw new Error('Chat not found');
      }

      console.log(`[WebSocket] Chat found: clientId=${chat.clientId}, adminId=${chat.adminId}, status=${chat.status}`);

      // Check if user has access to this chat
      const hasAccess = chat.clientId === userId || 
                       chat.adminId === userId || 
                       userRole === PrismaRole.ADMIN;

      if (!hasAccess) {
        console.error(`[WebSocket] Access denied for user ${userId} to chat ${chatId}. ClientId: ${chat.clientId}, AdminId: ${chat.adminId}, UserRole: ${userRole}`);
        throw new Error('Access denied to this chat');
      }

      console.log(`[WebSocket] Access granted for user ${userId} to chat ${chatId}`);

      // Join the socket room for this chat
      client.join(`chat:${chatId}`);
      console.log(`[WebSocket] User ${userId} joined socket room: chat:${chatId}`);

      // Track user in chat room
      if (!this.chatRooms.has(chatId)) {
        this.chatRooms.set(chatId, new Set());
      }
      this.chatRooms.get(chatId).add(userId);

      // Get recent messages
      console.log(`[WebSocket] Fetching recent messages for chat ${chatId}...`);
      const messagesPayload = await this.chatService.getChatMessages(
        chatId,
        userId,
        userRole,
        1,
        20,
      );

      console.log(`[WebSocket] Successfully joined chat ${chatId}. Messages count: ${messagesPayload.data?.length || 0}`);
      return {
        success: true,
        chatId,
        messages: messagesPayload,
      };
    } catch (error) {
      console.error(`[WebSocket] Join chat error for user ${client.user?.id} and chat ${chatId}:`, {
        error: error.message,
        stack: error.stack,
        user: client.user,
        chatId,
      });

      // Throw error to be handled by NestJS WebSocket exception filter
      throw error;
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveChat')
  handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() chatId: string,
  ): LeaveChatAckResponse {
    const userId = client.user.id;
    client.leave(`chat:${chatId}`);

    // Remove user from chat room tracking
    const chatRoom = this.chatRooms.get(chatId);
    if (chatRoom) {
      chatRoom.delete(userId);
      if (chatRoom.size === 0) {
        this.chatRooms.delete(chatId);
      }
    }

    console.log(`User ${userId} left chat room: ${chatId}`);
    return { success: true, chatId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    payload: {
      chatId: string;
      text?: string;
      fileId?: string;
      replyToId?: string;
    },
  ): Promise<SendMessageAckResponse> {
    try {
      const userId = client.user.id;
      const userRole = client.user.role;

      // Verify user has access to this chat
      const chat = await this.prisma.chat.findUnique({
        where: { id: payload.chatId },
      });

      if (!chat) {
        throw new Error('Chat not found');
      }

      // Check if user has access to this chat
      if (
        chat.clientId !== userId &&
        chat.adminId !== userId &&
        userRole !== PrismaRole.ADMIN
      ) {
        throw new Error('Access denied');
      }

      // Create the message
      const createMessageDto: CreateMessageDto = {
        chatId: payload.chatId,
        text: payload.text,
        fileId: payload.fileId,
        replyToId: payload.replyToId,
      };

      // Call service - it handles permissions, assignment, and notifications
      const messageResult = await this.chatService.createMessage(
        userId,
        userRole,
        createMessageDto,
      );

      return { success: true, message: messageResult };
    } catch (error) {
      console.error('Send message error:', error);
      // Throw error to be handled by NestJS WebSocket exception filter
      throw error;
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    const { chatId, isTyping } = data;
    const user = client.user;

    // Broadcast typing status to other users in the chat
    client.to(`chat:${chatId}`).emit('userTyping', {
      chatId,
      userId: user.id,
      email: user.email,
      isTyping,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('readMessages')
  async handleReadMessages(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string;  messageIds: string[] },
  ): Promise<ReadMessagesAckResponse> {
    try {
      const userRole = client.user.role;
      const { chatId, messageIds } = data;

      if (!chatId || !messageIds || messageIds.length === 0) {
        throw new Error('Invalid payload for readMessages');
      }

      // Delegate to service
      await this.chatService.markMessagesAsRead(chatId, messageIds, userRole);

      // Service handles broadcasting the 'messagesRead' event now
      return { success: true, chatId, messageIds };
    } catch (error) {
      console.error('Read messages error:', error);
      throw error;
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ): Promise<DeleteMessageAckResponse> {
    try {
      const userId = client.user.id;
      const userRole = client.user.role;
      const { messageId } = data;

      if (!messageId) {
        throw new Error('Message ID is required');
      }

      // Delegate to service
      const result = await this.chatService.deleteMessage(messageId, userId, userRole);

      return result;
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; text: string },
  ): Promise<EditMessageAckResponse> {
    try {
      const userId = client.user.id;
      const userRole = client.user.role;
      const { messageId, text } = data;

      if (!messageId) {
        throw new Error('Message ID is required');
      }

      if (!text || text.trim().length === 0) {
        throw new Error('Message text is required');
      }

      // Delegate to service
      const result = await this.chatService.editMessage(messageId, userId, userRole, text);

      return result;
    } catch (error) {
      console.error('Edit message error:', error);
      throw error;
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('clearChatMessages')
  async handleClearChatMessages(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ): Promise<ClearChatMessagesAckResponse> {
    try {
      const userId = client.user.id;
      const userRole = client.user.role;
      const { chatId } = data;

      if (!chatId) {
        throw new Error('Chat ID is required');
      }

      // Delegate to service
      const result = await this.chatService.clearChatMessages(chatId, userId, userRole);

      return result;
    } catch (error) {
      console.error('Clear chat messages error:', error);
      throw error;
    }
  }

  // Utility method to notify users when someone joins/leaves a chat
  private notifyChatParticipants(
    chatId: string,
    userId: number,
    action: 'joined' | 'left',
  ) {
    this.server.to(`chat:${chatId}`).emit('participantUpdate', {
      chatId,
      userId,
      action,
      timestamp: new Date().toISOString(),
    });
  }

  // Utility method to get active users in a chat
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('getActiveUsers')
  handleGetActiveUsers(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() chatId: string,
  ): GetActiveUsersAckResponse {
    const activeUsers = Array.from(this.chatRooms.get(chatId) || []);
    return { success: true, chatId, userIds: activeUsers };
  }

  // Method to notify users about new messages (called from REST API)
  async notifyNewMessage(chatId: string, message: MessageWithSender) {
    this.server.to(`chat:${chatId}`).emit('newMessage', message);

    // Notify admins if it's a new client message in an unassigned chat
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: { adminId: true },
      });
      if (chat && !chat.adminId && message.sender.role === PrismaRole.CLIENT) {
        this.server
          .to(this.adminRoom)
          .emit('newClientMessage', { chatId, message });
        console.log(`Notified admins: new msg in unassigned chat ${chatId}`);
      }
    } catch (error) {
      console.error(
        `Error checking chat ${chatId} for admin notification:`,
        error,
      );
    }
  }

  // Method to notify about chat status changes
  notifyChatStatusChange(chatId: string, status: PrismaChatStatus) {
    this.server.to(`chat:${chatId}`).emit('chatStatusChanged', {
      chatId,
      status,
    });
  }

  // Method to notify when an admin is assigned to a chat
  notifyAdminAssigned(
    chatId: string,
    adminId: string,
    admin: PartialAdminInfo,
  ) {
    const payload = {
      chatId,
      adminId,
      // Selectively send profile info
      adminProfile: admin?.profile
        ? {
            firstName: admin.profile.firstName,
            lastName: admin.profile.lastName,
            // Add other needed fields, e.g., email: admin.email?
          }
        : { email: admin?.email }, // Send email if profile missing
    };
    // Notify participants in the specific chat
    this.server.to(`chat:${chatId}`).emit('adminAssigned', payload);
    // Notify all admins that the chat is taken
    this.server.to(this.adminRoom).emit('chatAssigned', { chatId, adminId });
  }

  notifyMessagesRead(chatId: string, userRole: string, messageIds: string[]) {
    if (messageIds.length === 0) return;
    this.server.to(`chat:${chatId}`).emit('messagesRead', {
      chatId, // Include chatId for context
      userRole,
      messageIds,
    });
  }
}
