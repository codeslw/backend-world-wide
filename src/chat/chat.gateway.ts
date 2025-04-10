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
import { Inject, UseGuards } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../db/prisma.service';
import { Role } from '../common/enum/roles.enum';

interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict this to your frontend domain
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  
  // Store active connections by user ID and chat ID
  private userSockets: Map<string, Set<string>> = new Map();
  private chatRooms: Map<string, Set<string>> = new Map();

  constructor(
    @Inject('CHAT_SERVICE_PROVIDER') private chatService: any,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Extract and verify JWT token
      const token = client.handshake.auth.token || 
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
      (client as AuthenticatedSocket).user = {
        id: user.id,
        email: user.email,
        role: user.role as Role,
      };

      // Store socket connection
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id).add(client.id);

      console.log(`Client connected: ${client.id}, User: ${user.id}`);
    } catch (error) {
      console.error('WebSocket connection error:', error);
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
  ) {
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
      if (chat.clientId !== userId && chat.adminId !== userId && userRole !== Role.ADMIN) {
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
      const messages = await this.chatService.getChatMessages(chatId, userId, userRole);
      
      return { event: 'joinedChat', data: { chatId, messages } };
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
  ) {
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
    
    return { event: 'leftChat', data: { chatId } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ): Promise<WsResponse<any>> {
    try {
      const userId = client.user.id;
      const userRole = client.user.role;
      
      // Verify user has access to this chat
      const chat = await this.prisma.chat.findUnique({
        where: { id: createMessageDto.chatId },
      });

      if (!chat) {
        return { event: 'error', data: 'Chat not found' };
      }

      // Check if user has access to this chat
      if (chat.clientId !== userId && chat.adminId !== userId && userRole !== Role.ADMIN) {
        return { event: 'error', data: 'Access denied' };
      }

      // Create the message
      const message = await this.chatService.createMessage({
        ...createMessageDto,
        senderId: userId,
      });

      // Broadcast to all users in the chat room
      this.server.to(`chat:${createMessageDto.chatId}`).emit('newMessage', message);
      
      return { event: 'messageSent', data: message };
    } catch (error) {
      console.error('Send message error:', error);
      return { event: 'error', data: 'Failed to send message' };
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
  ) {
    try {
      const userId = client.user.id;
      const { chatId, messageIds } = data;
      
      // Mark messages as read
      const updatedMessages = await this.chatService.markMessagesAsRead(messageIds, userId);
      
      // Notify other users in the chat that messages were read
      client.to(`chat:${chatId}`).emit('messagesRead', {
        userId,
        messageIds,
      });
      
      return { event: 'messagesMarkedRead', data: updatedMessages };
    } catch (error) {
      console.error('Read messages error:', error);
      return { event: 'error', data: 'Failed to mark messages as read' };
    }
  }

  // Utility method to notify users when someone joins/leaves a chat
  private notifyChatParticipants(chatId: string, userId: number, action: 'joined' | 'left') {
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
  notifyNewMessage(chatId: string, message: any) {
    this.server.to(`chat:${chatId}`).emit('newMessage', message);
  }

  // Method to notify about chat status changes
  notifyChatStatusChange(chatId: string, status: any) {
    this.server.to(`chat:${chatId}`).emit('chatStatusChanged', {
      chatId,
      status,
    });
  }
  
  // Method to notify when an admin is assigned to a chat
  notifyAdminAssigned(chatId: string, adminId: string) {
    this.server.to(`chat:${chatId}`).emit('adminAssigned', {
      chatId,
      adminId,
    });
  }
  
  // Method to notify when messages are read
  notifyMessagesRead(chatId: string, userId: string, messageIds: string[]) {
    this.server.to(`chat:${chatId}`).emit('messagesRead', {
      userId,
      messageIds,
    });
  }
}
