import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateChatStatusDto } from './dto/update-chat-status.dto';
import { FilesService } from '../files/files.service';
import { ChatGateway } from './chat.gateway';
// Use Prisma-generated types directly
import { Message, Prisma, User, Profile, Role as PrismaRole, ChatStatus } from '@prisma/client'; 

// Define and export the interface for partial admin info
export interface PartialAdminInfo {
  id: string;
  email: string;
  role: PrismaRole; 
  profile?: Profile | null;
}

// Define and export the interface for messages with sender details
// Ensure sender profile is included for frontend use
export interface MessageWithSender extends Message {
  sender: {
    id: string;
    email: string;
    role: PrismaRole;
    profile?: Partial<Profile> | null; // Include profile, make it optional
  };
  replyTo?: MessageWithSender | null; // Allow replyTo to also have sender info
  readBy?: { id: string }[]; // Ensure readBy is properly typed
}

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    // Use forwardRef to handle circular dependency with Gateway
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway?: ChatGateway
  ) {}

  // Method for ChatGateway to register itself (alternative to forwardRef setup)
  setChatGateway(gateway: ChatGateway) {
    this.chatGateway = gateway;
  }

  // --- Chat Methods --- 

  async createChat(userId: string, createChatDto: CreateChatDto) {
    const chat = await this.prisma.chat.create({
      data: {
        client: { connect: { id: userId } },
        status: ChatStatus.PENDING, // Chats start as PENDING
      },
    });

    // Handle initial message if provided
    if (createChatDto.initialMessage) {
      const initialMessageDto: CreateMessageDto = {
        chatId: chat.id,
        text: createChatDto.initialMessage,
      };
      // Need user role to call createMessage, assume CLIENT for chat creation
      await this.createMessage(userId, PrismaRole.CLIENT, initialMessageDto);
    }

    // Return chat details, fetch fresh to include message if created
    return this.getChatById(chat.id, userId, PrismaRole.CLIENT);
  }

  async getChatById(chatId: string, userId: string, userRole: PrismaRole) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        client: { select: { id: true, email: true, profile: true } },
        admin: { select: { id: true, email: true, profile: true, role: true } }, // Include role
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20, // Initial load limit
          include: {
            sender: { select: { id: true, email: true, role: true, profile: true } },
            replyTo: { 
                include: { 
                    sender: { select: { id: true, email: true, role: true, profile: true } } 
                }
            },
            readBy: { select: { id: true } },
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    // Permission check
    if (chat.clientId !== userId && chat.adminId !== userId && userRole !== PrismaRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    // Reverse messages for chronological order and add unread count
    const messages = chat.messages.reverse() as MessageWithSender[];
    const unreadCount = this.countUnreadMessages(messages, userId);

    return { 
        ...chat, 
        admin: chat.admin as PartialAdminInfo | null, // Cast admin to partial type
        messages, 
        unreadCount 
    };
  }

  async getUserChats(userId: string, userRole: PrismaRole, status?: ChatStatus) {
    const where: Prisma.ChatWhereInput = {};
    
    if (userRole === PrismaRole.ADMIN) {
      // Admins see their assigned chats + all unassigned/pending ones
      where.OR = [
        { adminId: userId },
        { adminId: null },
        { status: ChatStatus.PENDING } // Explicitly include PENDING
      ];
      // Apply status filter if provided, within the OR logic if needed or outside?
      // Applying outside restricts ALL results, applying inside restricts specific parts.
      // Let's apply outside for simplicity: admins see their/unassigned matching the status.
      if (status) { where.status = status; }
    } else { // CLIENT or other roles
      where.clientId = userId;
      if (status) { where.status = status; }
    }

    const chats = await this.prisma.chat.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        client: { select: { id: true, email: true, profile: true } },
        admin: { select: { id: true, email: true, profile: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Only fetch the last message for preview
          include: {
            sender: { select: { id: true, email: true, role: true, profile: true } },
            readBy: { select: { id: true } },
          },
        },
        _count: { select: { messages: true } },
      },
    });

    // Calculate unread count for each chat
    return chats.map(chat => {
        const lastMessage = chat.messages[0] as MessageWithSender | undefined;
        // Simplified: unread = last message exists, not sent by user, not read by user
        const isUnread = lastMessage && lastMessage.senderId !== userId && !lastMessage.readBy?.some(r => r.id === userId);
        return {
            ...chat,
            admin: chat.admin as PartialAdminInfo | null,
            messages: lastMessage ? [lastMessage] : [], // Keep as array for type consistency
            unreadCount: isUnread ? 1 : 0, // Simple unread flag based on last message
            // Proper unread count might require a separate query or different logic
        };
    });
  }

  // Simplified unread count - real implementation might be more complex
  private countUnreadMessages(messages: MessageWithSender[], userId: string): number {
    return messages.reduce((count, msg) => {
        const isRead = msg.readBy?.some(reader => reader.id === userId);
        if (!isRead && msg.senderId !== userId) {
            return count + 1;
        }
        return count;
    }, 0);
  }

  async assignAdminToChat(chatId: string, adminId: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

    if (!chat) throw new NotFoundException(`Chat not found`);
    if (chat.adminId) throw new ForbiddenException(`Chat already assigned`);
    if (chat.status === ChatStatus.CLOSED) throw new ForbiddenException(`Cannot assign a closed chat`);

    // Verify the user being assigned is actually an admin
    const adminUser = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!adminUser || adminUser.role !== PrismaRole.ADMIN) {
      throw new ForbiddenException('Target user is not an admin.');
    }

    const updatedChat = await this.prisma.chat.update({
      where: { id: chatId },
      data: { 
        admin: { connect: { id: adminId } },
        status: ChatStatus.ACTIVE 
      },
      include: { 
        admin: { select: { id: true, email: true, profile: true, role: true } } 
      } 
    });

    if (this.chatGateway && updatedChat.admin) { 
      const adminInfo: PartialAdminInfo = updatedChat.admin;
      this.chatGateway.notifyAdminAssigned(chatId, adminId, adminInfo);
      this.chatGateway.notifyChatStatusChange(chatId, updatedChat.status);
    }

    return { ...updatedChat, admin: updatedChat.admin as PartialAdminInfo | null };
  }

  async updateChatStatus(chatId: string, userId: string, userRole: PrismaRole, updateChatStatusDto: UpdateChatStatusDto) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

    if (!chat) throw new NotFoundException(`Chat not found`);

    // Permissions: Only assigned admin or any admin can change status (adjust if needed)
    if (userRole !== PrismaRole.ADMIN && chat.adminId !== userId) {
      throw new ForbiddenException('Permission denied to update chat status');
    }
    
    // Prevent reopening a closed chat (adjust if needed)
    if (chat.status === ChatStatus.CLOSED && updateChatStatusDto.status !== ChatStatus.CLOSED) {
         throw new ForbiddenException('Cannot reopen a closed chat');
    }

    const updatedChat = await this.prisma.chat.update({
      where: { id: chatId },
      data: { status: updateChatStatusDto.status },
      include: { 
        admin: { select: { id: true, email: true, profile: true, role: true } } 
      } 
    });

    if (this.chatGateway) {
      this.chatGateway.notifyChatStatusChange(chatId, updatedChat.status);
    }

    return { ...updatedChat, admin: updatedChat.admin as PartialAdminInfo | null };
  }

  // --- Message Methods --- 

  async createMessage(userId: string, userRole: PrismaRole, createMessageDto: CreateMessageDto) {
    const { chatId, text, fileId, replyToId } = createMessageDto;

    let chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

    if (!chat) throw new NotFoundException(`Chat with ID ${chatId} not found`);

    // Permission check
    if (chat.clientId !== userId && chat.adminId !== userId && userRole !== PrismaRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    let adminAssignedInThisRequest = false;
    let assignedAdminInfo: PartialAdminInfo | null = null;

    // --- Admin Auto-Assignment Logic --- 
    if (!chat.adminId && userRole === PrismaRole.ADMIN) {
      try {
        console.log(`Admin ${userId} assigning chat ${chatId} by sending message...`);
        // Update DB first
        await this.prisma.chat.update({
          where: { id: chatId },
          data: { 
            admin: { connect: { id: userId } },
            status: ChatStatus.ACTIVE 
          }
        });
        
        // Fetch admin details for notification
        assignedAdminInfo = await this.prisma.user.findUnique({ 
            where: { id: userId }, 
            select: { id: true, email: true, role: true, profile: true } 
        });

        if (!assignedAdminInfo) throw new Error('Failed to fetch assigned admin details.');

        // Update local chat object state
        chat.adminId = userId;
        chat.status = ChatStatus.ACTIVE;
        adminAssignedInThisRequest = true;

        console.log(`Chat ${chatId} assigned to admin ${userId}. Status: ${chat.status}`);

        // Notify immediately
        if (this.chatGateway) {
          this.chatGateway.notifyAdminAssigned(chatId, userId, assignedAdminInfo);
          this.chatGateway.notifyChatStatusChange(chatId, chat.status); 
        }
      } catch (error) { // Log error but maybe don't block message sending?
        console.error(`CRITICAL: Failed to auto-assign admin ${userId} to chat ${chatId}:`, error);
        // Depending on policy, you might throw here or just log the assignment failure
        // throw new Error('Failed to assign admin to chat before sending message'); 
      }
    }
    // --- End Admin Auto-Assignment --- 

    // Re-check status (could have been closed by another admin just now?)
    // Or rely on the assignment logic having set it to ACTIVE if applicable.
    if (chat.status !== ChatStatus.ACTIVE) {
       throw new ForbiddenException(`Cannot send messages to a chat with status: ${chat.status}`);
    }

    // Prepare message data
    const messageData: Prisma.MessageCreateInput = {
      chat: { connect: { id: chatId } },
      sender: { connect: { id: userId } },
      text: text || undefined,
      readBy: { connect: { id: userId } } // Auto-read by sender
    };

    // Handle file URL
    if (fileId) {
      const file = await this.filesService.getFile(fileId);
      if (!file) throw new NotFoundException(`File with ID ${fileId} not found.`);
      messageData.fileUrl = file.url;
    }

    // Handle reply
    if (replyToId) {
      const replyMessage = await this.prisma.message.count({ where: { id: replyToId, chatId: chatId } });
      if (replyMessage === 0) throw new NotFoundException('Reply message not found in this chat.');
      messageData.replyTo = { connect: { id: replyToId } };
    }

    // Create the message
    const message = await this.prisma.message.create({
      data: messageData,
      include: {
        sender: { select: { id: true, email: true, role: true, profile: true } },
        replyTo: { 
            include: { 
                sender: { select: { id: true, email: true, role: true, profile: true } } 
            }
        },
        readBy: { select: { id: true } },
      },
    });

    // Update chat's updatedAt timestamp
    await this.prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });

    // Notify via WebSocket
    if (this.chatGateway) {
      this.chatGateway.notifyNewMessage(chatId, message as MessageWithSender);
    }

    return message as MessageWithSender;
  }

  async getChatMessages(chatId: string, userId: string, userRole: PrismaRole, page: number = 1, limit: number = 20) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

    if (!chat) throw new NotFoundException(`Chat with ID ${chatId} not found`);

    // Permission check
    if (chat.clientId !== userId && chat.adminId !== userId && userRole !== PrismaRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    const skip = (page - 1) * limit;
    const where = { chatId };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'asc' }, // Fetch oldest first for pagination
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, email: true, role: true, profile: true } },
          replyTo: { 
              include: { 
                  sender: { select: { id: true, email: true, role: true, profile: true } } 
              }
          },
          readBy: { select: { id: true } },
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    // Mark retrieved messages as read by the current user
    const messageIdsToMark = messages
        .filter(msg => msg.senderId !== userId && !msg.readBy.some(r => r.id === userId))
        .map(msg => msg.id);
        
    if (messageIdsToMark.length > 0) {
      await this.markMessagesAsRead(chatId, messageIdsToMark, userId);
    }

    return {
      data: messages as MessageWithSender[], 
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markMessagesAsRead(chatId: string, messageIds: string[], userId: string) {
    // Optimization: Check which messages actually need updating for this user
    const messagesToUpdate = await this.prisma.message.findMany({
        where: {
            id: { in: messageIds },
            chatId: chatId, // Ensure messages belong to the chat
            NOT: {
                readBy: {
                    some: { id: userId }
                }
            }
        },
        select: { id: true }
    });

    const idsToUpdate = messagesToUpdate.map(m => m.id);

    if (idsToUpdate.length === 0) {
        return; // Nothing to update for this user
    }

    // Use transaction for multiple updates
    await this.prisma.$transaction(
        idsToUpdate.map(messageId => 
            this.prisma.message.update({
                where: { id: messageId },
                data: { readBy: { connect: { id: userId } } },
            })
        )
    );
    
    // Notify other clients about read status
    if (this.chatGateway) {
      this.chatGateway.notifyMessagesRead(chatId, userId, idsToUpdate);
    }
  }
} 