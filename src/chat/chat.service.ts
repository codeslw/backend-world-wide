import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateChatStatusDto } from './dto/update-chat-status.dto';
import { ChatStatus } from '../common/enum/chat.enum';
import { FilesService } from '../files/files.service';
import { Role } from '../common/enum/roles.enum';
import { ChatGateway } from './chat.gateway';
import { Message, Prisma } from '@prisma/client';

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    email: string;
    role: string;
    profile?: any;
  };
  replyTo?: Message;
}

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway?: ChatGateway
  ) {}

  // Backward compatibility method to set the gateway after initialization
  // This can be removed after proper circular dependency is established
  setChatGateway(gateway: ChatGateway) {
    this.chatGateway = gateway;
  }

  async createChat(userId: string, createChatDto: CreateChatDto) {
    const chat = await this.prisma.chat.create({
      data: {
        client: {
          connect: { id: userId }
        },
        status: ChatStatus.PENDING, // Start as pending until admin joins
      },
    });

    // If there's an initial message, create it directly without the chat status check
    if (createChatDto.initialMessage) {
      // Create message directly without status validation
      const message = await this.prisma.message.create({
        data: {
          chat: { connect: { id: chat.id } },
          sender: { connect: { id: userId } },
          text: createChatDto.initialMessage || '',
          readBy: {
            connect: { id: userId } // Mark as read by the sender automatically
          }
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: true,
            },
          },
          readBy: {
            select: {
              id: true
            }
          }
        },
      });

      // Notify connected clients via WebSockets
      if (this.chatGateway) {
        this.chatGateway.notifyNewMessage(chat.id, message);
      }
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
            readBy: {
              select: {
                id: true
              }
            }
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

  async getUserChats(userId: string, userRole: Role, status?: ChatStatus) {
    const where: Prisma.ChatWhereInput = {};
    
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
        client: {
          select: {
            id: true,
            email: true,
            profile: true,
          }
        },
        admin: {
          select: {
            id: true,
            email: true,
            profile: true,
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                email: true,
              }
            },
            readBy: {
              select: {
                id: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
    });

    // Add unread count for each chat
    return chats.map(chat => {
      const unreadCount = this.countUnreadMessages(chat, userId);
      return {
        ...chat,
        unreadCount,
      };
    });
  }

  private countUnreadMessages(chat: any, userId: string): number {
    // This is a simple implementation - for a real app, you'd want to use a database query
    let unreadCount = 0;
    if (chat.messages) {
      for (const message of chat.messages) {
        const isRead = message.readBy?.some(reader => reader.id === userId);
        if (!isRead && message.sender.id !== userId) {
          unreadCount++;
        }
      }
    }
    return unreadCount;
  }

  async assignAdminToChat(chatId: string, adminId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    const updatedChat = await this.prisma.chat.update({
      where: { id: chatId },
      data: { 
        admin: { connect: { id: adminId } },
        status: ChatStatus.ACTIVE 
      },
      include: { 
        admin: { 
          select: { id: true, email: true, profile: true, role: true } 
        } 
      } 
    });

    // Notify about admin assignment and status change
    if (this.chatGateway && updatedChat.admin) { 
      const adminInfo: PartialAdminInfo = updatedChat.admin;
      // Pass the adminInfo object as the third argument
      this.chatGateway.notifyAdminAssigned(chatId, adminId, adminInfo); 
      this.chatGateway.notifyChatStatusChange(chatId, updatedChat.status);
    }

    return updatedChat;
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

    // Validate status transitions
    if (chat.status === ChatStatus.CLOSED && updateChatStatusDto.status !== ChatStatus.CLOSED) {
      throw new ForbiddenException('Cannot reopen a closed chat');
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

  async createMessage(userId: string, userRole: PrismaRole, createMessageDto: CreateMessageDto) {
    const { chatId, text, fileId, replyToId } = createMessageDto;

    let chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      // Include admin to check assignment status
      include: { admin: true } 
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    // Check if user has access (Client owns, Admin assigned, or Admin sending to unassigned)
    if (chat.clientId !== userId && chat.adminId !== userId && userRole !== PrismaRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    let adminAssignedInThisRequest = false;
    let assignedAdminInfo: PartialAdminInfo | null = null;

    // --- Start: Admin Auto-Assignment Logic --- 
    // If chat is unassigned AND the sender is an admin, assign the chat to them BEFORE creating the message.
    if (!chat.adminId && userRole === PrismaRole.ADMIN) {
      try {
        console.log(`Admin ${userId} sending first message to unassigned chat ${chatId}. Assigning...`);
        // Update the chat in the database to assign admin and set status to ACTIVE
        const updatedChatData = await this.prisma.chat.update({
          where: { id: chatId },
          data: { 
            admin: { connect: { id: userId } },
            status: ChatStatus.ACTIVE 
          },
          // Include admin details needed for notification
          include: { admin: { select: { id: true, email: true, profile: true, role: true } } }
        });
        
        // Update the local chat object for consistency
        chat = updatedChatData; 
        assignedAdminInfo = updatedChatData.admin as PartialAdminInfo;
        adminAssignedInThisRequest = true;

        console.log(`Admin ${userId} successfully assigned to chat ${chatId}. Status: ${chat.status}`);

        // Notify about assignment immediately
        if (this.chatGateway && assignedAdminInfo) {
          this.chatGateway.notifyAdminAssigned(chatId, userId, assignedAdminInfo);
          this.chatGateway.notifyChatStatusChange(chatId, chat.status); // Notify status change
        }

      } catch (error) {
        console.error(`Failed to auto-assign admin ${userId} to chat ${chatId}:`, error);
        // Decide if this should prevent message sending or just log
        throw new Error('Failed to assign admin to chat before sending message'); 
      }
    }
    // --- End: Admin Auto-Assignment Logic --- 

    // Now, re-check chat status after potential assignment
    if (chat.status !== ChatStatus.ACTIVE) {
      // If admin was just assigned, chat status is now ACTIVE. If not, and status isn't active, forbid.
       throw new ForbiddenException(`Cannot send messages to a chat with status: ${chat.status}`);
    }

    // Prepare message data
    const messageData: Prisma.MessageCreateInput = {
      chat: { connect: { id: chatId } },
      sender: { connect: { id: userId } },
      text: text || '',
      readBy: { connect: { id: userId } } // Auto-read by sender
    };

    // Handle file URL
    if (fileId) {
      try {
        const file = await this.filesService.getFile(fileId);
        if (!file) throw new NotFoundException(); // Ensure file exists
        messageData.fileUrl = file.url;
      } catch (error) {
        console.error(`File service error for fileId ${fileId}:`, error);
        throw new NotFoundException(`File with ID ${fileId} not found or failed to retrieve.`);
      }
    }

    // Handle reply
    if (replyToId) {
      const replyMessage = await this.prisma.message.findFirst({
        where: { id: replyToId, chatId: chatId }, // Ensure reply is in the same chat
      });
      if (!replyMessage) {
        throw new NotFoundException('Reply message not found or belongs to a different chat');
      }
      messageData.replyTo = { connect: { id: replyToId } };
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
        readBy: { select: { id: true } }
      },
    });

    // Update chat's updatedAt timestamp
    // We do this separately to ensure it happens even if admin assignment failed but we allowed message sending
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Notify about the new message (admin assignment notification already sent if applicable)
    if (this.chatGateway) {
      this.chatGateway.notifyNewMessage(chatId, message as MessageWithSender);
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
          sender: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: true,
            }
          },
          readBy: {
            select: {
              id: true
            }
          }
        },
      }),
      this.prisma.message.count({
        where: { chatId },
      }),
    ]);

    // Mark retrieved messages as read by the current user
    const messageIds = messages.map(message => message.id);
    if (messageIds.length > 0) {
      await this.markMessagesAsRead(messageIds, userId);
    }

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

  async markMessagesAsRead(messageIds: string[], userId: string) {
    // Create a transaction to handle multiple operations
    const operations = messageIds.map(messageId => 
      this.prisma.message.update({
        where: { id: messageId },
        data: {
          readBy: {
            connect: {
              id: userId
            }
          }
        },
        include: {
          readBy: {
            select: {
              id: true
            }
          }
        }
      })
    );

    const updatedMessages = await this.prisma.$transaction(operations);
    
    // Notify other clients about read status
    if (this.chatGateway) {
      // Group by chat ID to send a single notification per chat
      const messagesByChat = updatedMessages.reduce((acc, message) => {
        if (!acc[message.chatId]) {
          acc[message.chatId] = [];
        }
        acc[message.chatId].push(message.id);
        return acc;
      }, {});

      Object.entries(messagesByChat).forEach(([chatId, ids]) => {
        this.chatGateway.notifyMessagesRead(chatId, userId, ids as string[]);
      });
    }

    return updatedMessages;
  }
} 