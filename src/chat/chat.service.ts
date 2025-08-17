import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateChatStatusDto } from './dto/update-chat-status.dto';
import { FilesService } from '../files/files.service';
import { ChatGateway } from './chat.gateway';
// Use Prisma-generated types directly
import {
  Message,
  Prisma,
  User,
  Profile,
  Role as PrismaRole,
  ChatStatus,
  MessageStatus,
} from '@prisma/client';
import { MessageResponseDto } from './dto/message-response.dto'; // Import DTO

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
}

// Helper function to map Prisma Message to MessageResponseDto structure
const mapMessageToDto = (
  message: any,
  currentUserId: string,
): MessageResponseDto => {
  if (!message) return null;

  const isReadByCurrentUser =
    message.readBy?.some((reader) => reader.id === currentUserId) || false;
  const replyToDto = message.replyTo
    ? mapMessageToDto(message.replyTo, currentUserId)
    : null;

  return {
    id: message.id,
    chatId: message.chatId,
    sender: message.sender,
    text: message.text,
    fileUrl: message.fileUrl,
    createdAt: message.createdAt,
    replyToId: message.replyToId,
    replyTo: replyToDto,
    isReadByCurrentUser,
    readByClient: message.readByClient,
    readByAdmin: message.readByAdmin,
    isEdited: message.isEdited,
    editedAt: message.editedAt,
    status: message.status,
  };
};

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    // Use forwardRef to handle circular dependency with Gateway
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway?: ChatGateway,
  ) {}

  // Method for ChatGateway to register itself (alternative to forwardRef setup)
  setChatGateway(gateway: ChatGateway) {
    this.chatGateway = gateway;
  }

  // Helper to calculate unread count for a specific user in a chat
  private async calculateUnreadCount(
    chatId: string,
    userId: string,
  ): Promise<number> {
    // First determine the user's role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return 0;

    return this.prisma.message.count({
      where: {
        chatId: chatId,
        senderId: { not: userId }, // Messages not sent by the user
        // Count based on user's role-specific read status
        ...(user.role === PrismaRole.CLIENT
          ? { readByClient: false }
          : { readByAdmin: false }),
      },
    });
  }

  // --- Chat Methods ---

  async createChat(userId: string, createChatDto: CreateChatDto) {
    const chat = await this.prisma.chat.create({
      data: {
        client: { connect: { id: userId } },
        status: ChatStatus.PENDING, // Chats start as PENDING
      },
      include: {
        client: {
          select: { id: true, email: true, profile: true, role: true },
        },
      }, // Include client details
    });

    let initialMessageDto: MessageResponseDto | null = null;
    if (createChatDto.initialMessage) {
      const createMsgDto: CreateMessageDto = {
        chatId: chat.id,
        text: createChatDto.initialMessage,
      };
      const message = await this.createMessage(
        userId,
        PrismaRole.CLIENT,
        createMsgDto,
      );
      initialMessageDto = message; // createMessage now returns the DTO
    }

    return {
      ...chat,
      admin: null,
      messages: initialMessageDto ? [initialMessageDto] : [],
      unreadCount: 0, // Unread count is 0 for creator initially
    };
  }

  async getChatById(chatId: string, userId: string, userRole: PrismaRole) {
    const chatPrisma = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        client: {
          select: { id: true, email: true, profile: true, role: true },
        },
        admin: { select: { id: true, email: true, profile: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' }, // Fetch latest first for initial view
          take: 20,
          include: {
            sender: {
              select: { id: true, email: true, role: true, profile: true },
            },
            replyTo: {
              include: {
                sender: {
                  select: { id: true, email: true, role: true, profile: true },
                },
              },
            },
          },
        },
      },
    });

    if (!chatPrisma)
      throw new NotFoundException(`Chat with ID ${chatId} not found`);

    if (
      chatPrisma.clientId !== userId &&
      chatPrisma.adminId !== userId &&
      userRole !== PrismaRole.ADMIN
    ) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    const unreadCount = await this.calculateUnreadCount(chatId, userId);
    const messagesDto = chatPrisma.messages
      .map((msg) => mapMessageToDto(msg, userId))
      .reverse(); // Reverse back to chronological for display

    return {
      id: chatPrisma.id,
      client: chatPrisma.client,
      admin: chatPrisma.admin as PartialAdminInfo | null,
      status: chatPrisma.status,
      createdAt: chatPrisma.createdAt,
      updatedAt: chatPrisma.updatedAt,
      messages: messagesDto,
      unreadCount,
    };
  }

  async getUserChats(
    userId: string,
    userRole: PrismaRole,
    status?: ChatStatus,
  ) {
    const where: Prisma.ChatWhereInput = {};

    if (userRole === PrismaRole.ADMIN) {
      // Admins see their assigned chats + all unassigned/pending ones
      where.OR = [
        { adminId: userId },
        { adminId: null },
        { status: ChatStatus.PENDING }, // Explicitly include PENDING
      ];
      // Apply status filter if provided, within the OR logic if needed or outside?
      // Applying outside restricts ALL results, applying inside restricts specific parts.
      // Let's apply outside for simplicity: admins see their/unassigned matching the status.
      if (status) {
        where.status = status;
      }
    } else {
      // CLIENT or other roles
      where.clientId = userId;
      if (status) {
        where.status = status;
      }
    }

    const chatsPrisma = await this.prisma.chat.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        client: {
          select: { id: true, email: true, profile: true, role: true },
        },
        admin: { select: { id: true, email: true, profile: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Only fetch the last message for preview
          include: {
            sender: {
              select: { id: true, email: true, role: true, profile: true },
            },
          },
        },
        _count: { select: { messages: true } },
      },
    });

    if (chatsPrisma.length === 0) return [];

    const chatIds = chatsPrisma.map((c) => c.id);
    const unreadCounts = await this.prisma.message.groupBy({
      by: ['chatId'],
      where: {
        chatId: { in: chatIds },
        senderId: { not: userId },
        // Count based on user's role-specific read status
        ...(userRole === PrismaRole.CLIENT
          ? { readByClient: false }
          : { readByAdmin: false }),
      },
      _count: { id: true },
    });
    const unreadCountMap = new Map(
      unreadCounts.map((item) => [item.chatId, item._count.id]),
    );

    return chatsPrisma.map((chat) => {
      const lastMessageDto = chat.messages[0]
        ? mapMessageToDto(chat.messages[0], userId)
        : null;
      return {
        id: chat.id,
        client: chat.client,
        admin: chat.admin as PartialAdminInfo | null,
        status: chat.status,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messages: lastMessageDto ? [lastMessageDto] : [],
        unreadCount: unreadCountMap.get(chat.id) || 0,
      };
    });
  }

  async assignAdminToChat(chatId: string, adminId: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

    if (!chat) throw new NotFoundException(`Chat not found`);
    if (chat.adminId) throw new ForbiddenException(`Chat already assigned`);
    if (chat.status === ChatStatus.CLOSED)
      throw new ForbiddenException(`Cannot assign a closed chat`);

    // Verify the user being assigned is actually an admin
    const adminUser = await this.prisma.user.findUnique({
      where: { id: adminId },
    });
    if (!adminUser || adminUser.role !== PrismaRole.ADMIN) {
      throw new ForbiddenException('Target user is not an admin.');
    }

    const updatedChat = await this.prisma.chat.update({
      where: { id: chatId },
      data: {
        admin: { connect: { id: adminId } },
        status: ChatStatus.ACTIVE,
      },
      include: {
        admin: { select: { id: true, email: true, profile: true, role: true } },
      },
    });

    if (this.chatGateway && updatedChat.admin) {
      const adminInfo: PartialAdminInfo = updatedChat.admin;
      this.chatGateway.notifyAdminAssigned(chatId, adminId, adminInfo);
      this.chatGateway.notifyChatStatusChange(chatId, updatedChat.status);
    }

    return {
      ...updatedChat,
      admin: updatedChat.admin as PartialAdminInfo | null,
    };
  }

  async updateChatStatus(
    chatId: string,
    userId: string,
    userRole: PrismaRole,
    updateChatStatusDto: UpdateChatStatusDto,
  ) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

    if (!chat) throw new NotFoundException(`Chat not found`);

    // Permissions: Only assigned admin or any admin can change status (adjust if needed)
    if (userRole !== PrismaRole.ADMIN && chat.adminId !== userId) {
      throw new ForbiddenException('Permission denied to update chat status');
    }

    // Prevent reopening a closed chat (adjust if needed)
    if (
      chat.status === ChatStatus.CLOSED &&
      updateChatStatusDto.status !== ChatStatus.CLOSED
    ) {
      throw new ForbiddenException('Cannot reopen a closed chat');
    }

    const updatedChat = await this.prisma.chat.update({
      where: { id: chatId },
      data: { status: updateChatStatusDto.status },
      include: {
        admin: { select: { id: true, email: true, profile: true, role: true } },
      },
    });

    if (this.chatGateway) {
      this.chatGateway.notifyChatStatusChange(chatId, updatedChat.status);
    }

    return {
      ...updatedChat,
      admin: updatedChat.admin as PartialAdminInfo | null,
    };
  }

  // --- Message Methods ---

  async createMessage(
    userId: string,
    userRole: PrismaRole,
    createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const { chatId, text, fileId, replyToId } = createMessageDto;

    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

    if (!chat) throw new NotFoundException(`Chat with ID ${chatId} not found`);

    // Permission check
    if (
      chat.clientId !== userId &&
      chat.adminId !== userId &&
      userRole !== PrismaRole.ADMIN
    ) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    let adminAssignedInThisRequest = false;
    let assignedAdminInfo: PartialAdminInfo | null = null;
    let clientActivatedChat = false;

    // --- Client Auto-Activation Logic for PENDING Chats ---
    if (
      chat.status === ChatStatus.PENDING &&
      chat.clientId === userId &&
      userRole === PrismaRole.CLIENT
    ) {
      try {
        console.log(
          `Client ${userId} activating their PENDING chat ${chatId} by sending first message...`,
        );
        // Update DB to activate the chat
        await this.prisma.chat.update({
          where: { id: chatId },
          data: {
            status: ChatStatus.ACTIVE,
          },
        });

        // Update local chat object state
        chat.status = ChatStatus.ACTIVE;
        clientActivatedChat = true;

        console.log(
          `Chat ${chatId} activated by client ${userId}. Status: ${chat.status}`,
        );

        // Notify via WebSocket
        if (this.chatGateway) {
          this.chatGateway.notifyChatStatusChange(chatId, chat.status);
        }
      } catch (error) {
        console.error(
          `CRITICAL: Failed to activate chat ${chatId} for client ${userId}:`,
          error,
        );
        // Don't throw here, allow the message to be sent anyway
      }
    }

    // --- Admin Auto-Assignment Logic ---
    if (!chat.adminId && userRole === PrismaRole.ADMIN) {
      try {
        console.log(
          `Admin ${userId} assigning chat ${chatId} by sending message...`,
        );
        // Update DB first
        await this.prisma.chat.update({
          where: { id: chatId },
          data: {
            admin: { connect: { id: userId } },
            status: ChatStatus.ACTIVE,
          },
        });

        // Fetch admin details for notification
        assignedAdminInfo = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, role: true, profile: true },
        });

        if (!assignedAdminInfo)
          throw new Error('Failed to fetch assigned admin details.');

        // Update local chat object state
        chat.adminId = userId;
        chat.status = ChatStatus.ACTIVE;
        adminAssignedInThisRequest = true;

        console.log(
          `Chat ${chatId} assigned to admin ${userId}. Status: ${chat.status}`,
        );

        // Notify immediately
        if (this.chatGateway) {
          this.chatGateway.notifyAdminAssigned(
            chatId,
            userId,
            assignedAdminInfo,
          );
          this.chatGateway.notifyChatStatusChange(chatId, chat.status);
        }
      } catch (error) {
        // Log error but maybe don't block message sending?
        console.error(
          `CRITICAL: Failed to auto-assign admin ${userId} to chat ${chatId}:`,
          error,
        );
        // Depending on policy, you might throw here or just log the assignment failure
        // throw new Error('Failed to assign admin to chat before sending message');
      }
    }
    // --- End Admin Auto-Assignment ---

    // Re-check status (could have been closed by another admin just now?)
    // Or rely on the assignment logic having set it to ACTIVE if applicable.
    // Allow clients to send messages to their own PENDING chats
    if (
      chat.status !== ChatStatus.ACTIVE &&
      !(
        chat.status === ChatStatus.PENDING &&
        chat.clientId === userId &&
        userRole === PrismaRole.CLIENT
      )
    ) {
      throw new ForbiddenException(
        `Cannot send messages to a chat with status: ${chat.status}`,
      );
    }

    // Prepare message data
    const messageData: Prisma.MessageCreateInput = {
      chat: { connect: { id: chatId } },
      sender: { connect: { id: userId } },
      text: text || undefined,
      readByClient: false,
      readByAdmin: false,
      status: MessageStatus.SENT,
    };

    // Handle file URL
    if (fileId) {
      const file = await this.filesService.getFile(fileId);
      if (!file)
        throw new NotFoundException(`File with ID ${fileId} not found.`);
      messageData.fileUrl = file.url;
    }

    // Handle reply
    if (replyToId) {
      const replyMessage = await this.prisma.message.count({
        where: { id: replyToId, chatId: chatId },
      });
      if (replyMessage === 0)
        throw new NotFoundException('Reply message not found in this chat.');
      messageData.replyTo = { connect: { id: replyToId } };
    }

    // Create the message
    const message = await this.prisma.message.create({
      data: messageData,
      include: {
        sender: {
          select: { id: true, email: true, role: true, profile: true },
        },
        replyTo: {
          include: {
            sender: {
              select: { id: true, email: true, role: true, profile: true },
            },
          },
        },
      },
    });

    // Update chat's updatedAt timestamp
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Notify via WebSocket
    if (this.chatGateway) {
      this.chatGateway.notifyNewMessage(chatId, message as MessageWithSender);
    }

    const messageDto = mapMessageToDto(message, userId);

    return messageDto;
  }

  async getChatMessages(
    chatId: string,
    userId: string,
    userRole: PrismaRole,
    page: number = 1,
    limit: number = 20,
  ) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

    if (!chat) throw new NotFoundException(`Chat with ID ${chatId} not found`);

    // Permission check
    if (
      chat.clientId !== userId &&
      chat.adminId !== userId &&
      userRole !== PrismaRole.ADMIN
    ) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    const skip = (page - 1) * limit;
    const where = { chatId };

    const [messagesPrisma, total] = await Promise.all([
      this.prisma.message.findMany({
        orderBy: { createdAt: 'asc' }, // Fetch oldest first for pagination
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, email: true, role: true, profile: true },
          },
          replyTo: {
            include: {
              sender: {
                select: { id: true, email: true, role: true, profile: true },
              },
            },
          },
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    // Mark retrieved messages as read by the current user
    const messageIdsToMark = messagesPrisma
      .filter((msg) => {
        // Only mark messages not sent by current user
        if (msg.senderId === userId) return false;

        // Check if message is already read by this user based on their role
        return userRole === PrismaRole.CLIENT
          ? !msg.readByClient
          : !msg.readByAdmin;
      })
      .map((msg) => msg.id);

    if (messageIdsToMark.length > 0) {
      await this.markMessagesAsRead(chatId, messageIdsToMark, userRole);
    }

    const messagesDto = messagesPrisma.map((msg) =>
      mapMessageToDto(msg, userId),
    );

    return {
      data: messagesDto,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markMessagesAsRead(
    chatId: string,
    messageIds: string[],
    userRole: PrismaRole,
  ) {
    // Optimization: Check which messages actually need updating for this user
    const messagesToUpdate = await this.prisma.message.findMany({
      where: {
        id: { in: messageIds },
        chatId: chatId, // Ensure messages belong to the chat
        // Only update messages that haven't been read by this user role yet
        ...(userRole === PrismaRole.CLIENT
          ? { readByClient: false }
          : { readByAdmin: false }),
      },
      select: { id: true, readByClient: true, readByAdmin: true },
    });

    const idsToUpdate = messagesToUpdate.map((m) => m.id);

    if (idsToUpdate.length === 0) {
      return; // Nothing to update for this user
    }

    // Use transaction for multiple updates - preserve existing read status
    await this.prisma.$transaction(
      idsToUpdate.map((messageId) => {
        const currentMessage = messagesToUpdate.find((m) => m.id === messageId);
        return this.prisma.message.update({
          where: { id: messageId },
          data:
            userRole === PrismaRole.CLIENT
              ? { readByClient: true } // Keep existing readByAdmin value
              : { readByAdmin: true }, // Keep existing readByClient value
        });
      }),
    );

    // Notify other clients about read status
    if (this.chatGateway) {
      this.chatGateway.notifyMessagesRead(chatId, userRole, idsToUpdate);
    }
  }

  async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
    userId: string,
    userRole: PrismaRole,
  ) {
    // Get the message to verify permissions
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          select: { id: true, clientId: true, adminId: true },
        },
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Check if user has access to this chat
    if (
      message.chat.clientId !== userId &&
      message.chat.adminId !== userId &&
      userRole !== PrismaRole.ADMIN
    ) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    // Update the message status
    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: { status },
      include: {
        sender: {
          select: { id: true, email: true, role: true, profile: true },
        },
        replyTo: {
          include: {
            sender: {
              select: { id: true, email: true, role: true, profile: true },
            },
          },
        },
      },
    });

    // Notify via WebSocket about status change
    if (this.chatGateway) {
      const messageDto = mapMessageToDto(updatedMessage, userId);
      this.chatGateway.server
        .to(`chat:${message.chatId}`)
        .emit('messageStatusUpdated', {
          messageId,
          chatId: message.chatId,
          status,
          message: messageDto,
        });
    }

    return mapMessageToDto(updatedMessage, userId);
  }

  async deleteMessage(messageId: string, userId: string, userRole: PrismaRole) {
    // First, get the message with chat information
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          select: { id: true, clientId: true, adminId: true },
        },
        sender: {
          select: { id: true, role: true },
        },
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Permission check:
    // - Users can delete their own messages
    // - Admins can delete any message in chats they're assigned to
    // - Super admins (ADMIN role) can delete any message
    const canDelete =
      message.senderId === userId || // User's own message
      (userRole === PrismaRole.ADMIN && message.chat.adminId === userId) || // Assigned admin
      userRole === PrismaRole.ADMIN; // Any admin (adjust this if you want stricter permissions)

    if (!canDelete) {
      throw new ForbiddenException(
        'You do not have permission to delete this message',
      );
    }

    // Check if user has access to the chat
    if (
      message.chat.clientId !== userId &&
      message.chat.adminId !== userId &&
      userRole !== PrismaRole.ADMIN
    ) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    // Delete the message (Prisma will handle cascading deletes for replies)
    // Note: If this message has replies, you might want to handle them differently
    // Current setup will delete replies due to the cascade in the schema
    await this.prisma.message.delete({
      where: { id: messageId },
    });

    // Update chat's updatedAt timestamp
    await this.prisma.chat.update({
      where: { id: message.chatId },
      data: { updatedAt: new Date() },
    });

    // Notify via WebSocket about message deletion
    if (this.chatGateway) {
      this.chatGateway.server
        .to(`chat:${message.chatId}`)
        .emit('messageDeleted', {
          messageId,
          chatId: message.chatId,
          deletedBy: userId,
        });
    }

    return { success: true, messageId };
  }

  async editMessage(
    messageId: string,
    userId: string,
    userRole: PrismaRole,
    newText: string,
  ): Promise<{
    success: boolean;
    messageId: string;
    message: MessageResponseDto;
  }> {
    // First, get the message with chat and replies information
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          select: { id: true, clientId: true, adminId: true },
        },
        sender: {
          select: { id: true, role: true },
        },
        replies: {
          select: { id: true },
        },
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Permission check:
    // - Users can edit their own messages
    // - Admins can edit any message in chats they're assigned to
    const canEdit =
      message.senderId === userId || // User's own message
      (userRole === PrismaRole.ADMIN && message.chat.adminId === userId); // Assigned admin

    if (!canEdit) {
      throw new ForbiddenException(
        'You do not have permission to edit this message',
      );
    }

    // Check if user has access to the chat
    if (
      message.chat.clientId !== userId &&
      message.chat.adminId !== userId &&
      userRole !== PrismaRole.ADMIN
    ) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    // Business rule: Cannot edit messages that have replies (to maintain context)
    if (message.replies.length > 0) {
      throw new ForbiddenException('Cannot edit messages that have replies');
    }

    // Business rule: Time limit for editing (15 minutes)
    const editTimeLimit = 15 * 60 * 1000; // 15 minutes in milliseconds
    const now = new Date();
    const messageAge = now.getTime() - message.createdAt.getTime();

    if (messageAge > editTimeLimit && message.senderId === userId) {
      throw new ForbiddenException(
        'Cannot edit messages older than 15 minutes',
      );
    }

    // Business rule: Cannot edit messages with file attachments
    if (message.fileUrl) {
      throw new ForbiddenException(
        'Cannot edit messages with file attachments',
      );
    }

    // Validate the new text
    if (!newText || newText.trim().length === 0) {
      throw new ForbiddenException('Message text cannot be empty');
    }

    if (newText.trim() === message.text?.trim()) {
      throw new ForbiddenException(
        'New text must be different from the current text',
      );
    }

    // Update the message
    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        text: newText.trim(),
        isEdited: true,
        editedAt: now,
      },
      include: {
        sender: {
          select: { id: true, email: true, role: true, profile: true },
        },
        replyTo: {
          include: {
            sender: {
              select: { id: true, email: true, role: true, profile: true },
            },
          },
        },
      },
    });

    // Update chat's updatedAt timestamp
    await this.prisma.chat.update({
      where: { id: message.chat.id },
      data: { updatedAt: new Date() },
    });

    // Notify via WebSocket about message edit
    if (this.chatGateway) {
      const messageDto = mapMessageToDto(updatedMessage, userId);
      this.chatGateway.server
        .to(`chat:${message.chat.id}`)
        .emit('messageEdited', {
          messageId,
          chatId: message.chat.id,
          editedBy: userId,
          message: messageDto,
        });
    }

    const messageDto = mapMessageToDto(updatedMessage, userId);
    return { success: true, messageId, message: messageDto };
  }

  async clearChatMessages(
    chatId: string,
    userId: string,
    userRole: PrismaRole,
  ) {
    // Get the chat to verify permissions
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, clientId: true, adminId: true },
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    // Permission check: Only admins can clear entire chats
    // You can adjust this logic based on your requirements
    const canClear =
      userRole === PrismaRole.ADMIN &&
      (chat.adminId === userId || userRole === PrismaRole.ADMIN);

    if (!canClear) {
      throw new ForbiddenException(
        'Only assigned admins can clear chat messages',
      );
    }

    // Count messages before deletion for logging
    const messageCount = await this.prisma.message.count({
      where: { chatId },
    });

    if (messageCount === 0) {
      return {
        success: true,
        deletedCount: 0,
        message: 'No messages to delete',
      };
    }

    // Delete all messages in the chat
    const deleteResult = await this.prisma.message.deleteMany({
      where: { chatId },
    });

    // Update chat's updatedAt timestamp
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Log the action
    console.log(
      `Admin ${userId} cleared ${deleteResult.count} messages from chat ${chatId}`,
    );

    // Notify via WebSocket about chat being cleared
    if (this.chatGateway) {
      this.chatGateway.server.to(`chat:${chatId}`).emit('chatCleared', {
        chatId,
        clearedBy: userId,
        deletedCount: deleteResult.count,
      });
    }

    return {
      success: true,
      deletedCount: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} messages`,
    };
  }

  async deleteChat(chatId: string, userId: string, userRole: PrismaRole) {
    // Get the chat to verify permissions
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, clientId: true, adminId: true, status: true },
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    // Permission check: Only chat owner (client) or assigned admin can delete
    const canDelete =
      chat.clientId === userId ||
      (userRole === PrismaRole.ADMIN &&
        (chat.adminId === userId || userRole === PrismaRole.ADMIN));

    if (!canDelete) {
      throw new ForbiddenException(
        'You do not have permission to delete this chat',
      );
    }

    // Delete the chat (Prisma will cascade delete all messages)
    await this.prisma.chat.delete({
      where: { id: chatId },
    });

    // Notify via WebSocket about chat deletion
    if (this.chatGateway) {
      this.chatGateway.server.to(`chat:${chatId}`).emit('chatDeleted', {
        chatId,
        deletedBy: userId,
      });
    }

    // Log the action
    console.log(`Chat ${chatId} deleted by user ${userId} (role: ${userRole})`);

    return {
      success: true,
      message: 'Chat deleted successfully',
    };
  }
}
