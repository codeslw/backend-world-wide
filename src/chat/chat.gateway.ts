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
      // Extract and verify JWT token
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
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
        `Client connected: ${client.id}, User: ${user.id}, Role: ${user.role}`,
      );

      // Join admin room if applicable
      if (user.role === PrismaRole.ADMIN) {
        client.join(this.adminRoom);
        console.log(`Admin ${user.id} joined room: ${this.adminRoom}`);
      }

      client.emit('connected', { userId: user.id }); // Confirm connection to client
    } catch (error) {
      console.error('WebSocket connection error:', error.message);
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
  ): Promise<WsResponse<any>> {
    try {
      const userId = client.user.id;
      const userRole = client.user.role;

      // Verify user has access to this chat
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
      });

      if (!chat) {
        return { event: 'error', data: 'Chat not found' };
      }

      // Check if user has access to this chat
      if (
        chat.clientId !== userId &&
        chat.adminId !== userId &&
        userRole !== PrismaRole.ADMIN
      ) {
        return { event: 'error', data: 'Access denied' };
      }

      // Join the socket room for this chat
      client.join(`chat:${chatId}`);

      // Track user in chat room
      if (!this.chatRooms.has(chatId)) {
        this.chatRooms.set(chatId, new Set());
      }
      this.chatRooms.get(chatId).add(userId);

      // Get recent messages
      const messagesPayload = await this.chatService.getChatMessages(
        chatId,
        userId,
        userRole,
        1,
        20,
      );

      console.log(`User ${userId} joined chat room: ${chatId}`);
      return {
        event: 'joinedChat',
        data: { chatId, messages: messagesPayload },
      };
    } catch (error) {
      console.error('Join chat error:', error);
      return { event: 'error', data: 'Failed to join chat' };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveChat')
  handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() chatId: string,
  ): WsResponse<any> {
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
    return { event: 'leftChat', data: { chatId } };
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
  ): Promise<WsResponse<any>> {
    try {
      const userId = client.user.id;
      const userRole = client.user.role;

      // Verify user has access to this chat
      const chat = await this.prisma.chat.findUnique({
        where: { id: payload.chatId },
      });

      if (!chat) {
        return { event: 'error', data: 'Chat not found' };
      }

      // Check if user has access to this chat
      if (
        chat.clientId !== userId &&
        chat.adminId !== userId &&
        userRole !== PrismaRole.ADMIN
      ) {
        return { event: 'error', data: 'Access denied' };
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

      return { event: 'messageSent', data: messageResult };
    } catch (error) {
      console.error('Send message error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send message';
      // It's often better to emit exceptions back to the calling client
      client.emit('exception', {
        status: 'error',
        message: errorMessage,
        event: 'sendMessage',
      });
      return { event: 'error', data: errorMessage };
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
    @MessageBody() data: { chatId: string; messageIds: string[] },
  ): Promise<WsResponse<any>> {
    try {
      const userId = client.user.id;
      const { chatId, messageIds } = data;

      if (!chatId || !messageIds || messageIds.length === 0) {
        return { event: 'error', data: 'Invalid payload for readMessages' };
      }

      // Delegate to service
      await this.chatService.markMessagesAsRead(chatId, messageIds, userId);

      // Service handles broadcasting the 'messagesRead' event now
      return { event: 'messagesMarkedRead', data: { chatId, messageIds } };
    } catch (error) {
      console.error('Read messages error:', error);
      client.emit('exception', {
        status: 'error',
        message: 'Failed to mark messages as read',
        event: 'readMessages',
      });
      return { event: 'error', data: 'Failed to mark messages as read' };
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
  ) {
    const activeUsers = Array.from(this.chatRooms.get(chatId) || []);
    return { event: 'activeUsers', data: { chatId, userIds: activeUsers } };
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

  notifyMessagesRead(chatId: string, userId: string, messageIds: string[]) {
    if (messageIds.length === 0) return;
    this.server.to(`chat:${chatId}`).emit('messagesRead', {
      chatId, // Include chatId for context
      userId,
      messageIds,
    });
  }
}
