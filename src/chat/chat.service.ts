import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateChatStatusDto } from './dto/update-chat-status.dto';
import { ChatStatus } from '../common/enum/chat.enum';
import { FilesService } from '../files/files.service';
import { Role } from '../common/enum/roles.enum';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  private chatGateway: ChatGateway;

  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  // Method to set the gateway after initialization
  setChatGateway(gateway: ChatGateway) {
    this.chatGateway = gateway;
  }

  async createChat(userId: string, createChatDto: CreateChatDto) {
    const chat = await this.prisma.chat.create({
      data: {
        clientId: userId,
      },
    });

    // If there's an initial message, create it
    if (createChatDto.initialMessage) {
      await this.createMessage(userId, chat.id, {
        chatId: chat.id,
        text: createChatDto.initialMessage,
      });
    }

    return this.getChatById(chat.id, userId);
  }

  async getChatById(chatId: string, userId: string, userRole?: Role) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: true,
          },
        },
        admin: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            replyTo: true,
            sender: {
              select: {
                id: true,
                email: true,
                role: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    // Check if user has access to this chat
    if (chat.clientId !== userId && chat.adminId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    return {
      ...chat,
      messages: chat.messages.reverse(), // Return in chronological order
    };
  }

  async getUserChats(userId: number, userRole: Role, status?: ChatStatus) {
    const where: any = {};
    
    // Filter by user role
    if (userRole === Role.ADMIN) {
      if (status) {
        where.status = status;
      }
      // Admins can see all chats or filter by their assigned chats
      where.OR = [
        { adminId: userId },
        { adminId: null }, // Unassigned chats
      ];
    } else {
      // Regular users can only see their own chats
      where.clientId = userId;
      if (status) {
        where.status = status;
      }
    }

    const chats = await this.prisma.chat.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return chats;
  }

  async assignAdminToChat(chatId: string, adminId: string) {
    return this.prisma.chat.update({
      where: { id: chatId },
      data: { adminId },
    });
  }

  async updateChatStatus(chatId: string, userId: string, userRole: Role, updateChatStatusDto: UpdateChatStatusDto) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    // Only admins or the assigned admin can update chat status
    if (userRole !== Role.ADMIN && chat.adminId !== userId) {
      throw new ForbiddenException('You do not have permission to update this chat');
    }

    const updatedChat = await this.prisma.chat.update({
      where: { id: chatId },
      data: { status: updateChatStatusDto.status },
    });

    // Notify connected clients via WebSockets
    if (this.chatGateway) {
      this.chatGateway.notifyChatStatusChange(chatId, updateChatStatusDto.status);
    }

    return updatedChat;
  }

  async createMessage(userId: string, chatId: string, createMessageDto: CreateMessageDto) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    // Check if user has access to this chat
    if (chat.clientId !== userId && chat.adminId !== userId) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    // Check if chat is active
    if (chat.status !== ChatStatus.ACTIVE) {
      throw new ForbiddenException('Cannot send messages to a closed or pending chat');
    }

    // Prepare message data
    const messageData: any = {
      chatId,
      senderId: userId,
      text: createMessageDto.text,
    };

    // If there's a file, get its URL
    if (createMessageDto.fileId) {
      const file = await this.filesService.getFile(createMessageDto.fileId);
      messageData.fileUrl = file.url;
    }

    // If it's a reply, add the reference
    if (createMessageDto.replyToId) {
      messageData.replyToId = createMessageDto.replyToId;
    }

    // Create the message
    const message = await this.prisma.message.create({
      data: messageData,
      include: {
        replyTo: true,
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: true,
          },
        },
      },
    });

    // Update the chat's updatedAt timestamp
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Notify connected clients via WebSockets
    if (this.chatGateway) {
      this.chatGateway.notifyNewMessage(chatId, message);
    }

    return message;
  }

  async getChatMessages(chatId: string, userId: string, userRole: Role, page: number = 1, limit: number = 20) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    // Check if user has access to this chat
    if (chat.clientId !== userId && chat.adminId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    const skip = (page - 1) * limit;
    
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          replyTo: true,
        },
      }),
      this.prisma.message.count({
        where: { chatId },
      }),
    ]);

    return {
      data: messages.reverse(), // Return in chronological order
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markMessagesAsRead(messageIds: string[], userId: number) {
    // In a real implementation, you would update a 'readBy' field or similar
    // For now, we'll just return the message IDs that were marked as read
    return messageIds.map(id => ({ id, readBy: userId }));
  }
} 