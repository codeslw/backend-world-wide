import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../db/prisma.service';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { Role } from '../common/enum/roles.enum';
import { ChatService } from './chat.service';
import { Role as PrismaRole, ChatStatus } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    email: string;
    role: PrismaRole;
  };
}

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let chatService: ChatService;

  const mockChatService = {
    getChatMessages: jest.fn(),
    createMessage: jest.fn(),
    markMessagesAsRead: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn().mockReturnValue({ sub: '1' }),
  };

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: PrismaRole.CLIENT,
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChat = {
    id: 'chat-id',
    clientId: '1',
    adminId: null,
    status: ChatStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
    },
    chat: {
      findUnique: jest.fn().mockResolvedValue(mockChat),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
    chatService = module.get<ChatService>(ChatService);

    // Mock server
    gateway.server = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    } as any;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should authenticate user and store connection', async () => {
      const mockClient = {
        handshake: {
          auth: { token: 'valid-token' },
        },
        id: 'socket-id',
        disconnect: jest.fn(),
        emit: jest.fn(),
      } as unknown as Socket;

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: '1' });
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      await gateway.handleConnection(mockClient);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: { id: true, email: true, role: true },
      });
      expect(mockClient.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect if token is invalid', async () => {
      const mockClient = {
        handshake: {
          auth: { token: 'invalid-token' },
        },
        id: 'socket-id',
        disconnect: jest.fn(),
      } as unknown as Socket;

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(mockClient);

      expect(mockClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleJoinChat', () => {
    it('should return success response with chat data', async () => {
      const mockClient = {
        user: { id: '1', email: 'test@example.com', role: PrismaRole.CLIENT },
        join: jest.fn(),
      } as unknown as AuthenticatedSocket;

      const mockMessages = {
        data: [
          {
            id: 'msg-1',
            text: 'Hello',
            sender: {
              id: '1',
              email: 'test@example.com',
              role: PrismaRole.CLIENT,
              profile: null,
            },
            isReadByCurrentUser: false,
            createdAt: new Date(),
            chatId: 'chat-id',
            senderId: '1',
            replyToId: null,
            fileUrl: null,
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      jest.spyOn(prismaService.chat, 'findUnique').mockResolvedValue(mockChat);
      jest.spyOn(chatService, 'getChatMessages').mockResolvedValue(mockMessages);

      const result = await gateway.handleJoinChat(mockClient, 'chat-id');

      expect(result).toEqual({
        success: true,
        chatId: 'chat-id',
        messages: mockMessages,
      });
      expect(mockClient.join).toHaveBeenCalledWith('chat:chat-id');
    });

    it('should throw error for invalid chat ID', async () => {
      const mockClient = {
        user: { id: '1', email: 'test@example.com', role: PrismaRole.CLIENT },
      } as unknown as AuthenticatedSocket;

      await expect(gateway.handleJoinChat(mockClient, '')).rejects.toThrow('Invalid chat ID');
    });

    it('should throw error for non-existent chat', async () => {
      const mockClient = {
        user: { id: '1', email: 'test@example.com', role: PrismaRole.CLIENT },
      } as unknown as AuthenticatedSocket;

      jest.spyOn(prismaService.chat, 'findUnique').mockResolvedValue(null);

      await expect(gateway.handleJoinChat(mockClient, 'chat-id')).rejects.toThrow('Chat not found');
    });
  });

  describe('handleLeaveChat', () => {
    it('should return success response', () => {
      const mockClient = {
        user: { id: '1', email: 'test@example.com', role: PrismaRole.CLIENT },
        leave: jest.fn(),
      } as unknown as AuthenticatedSocket;

      const result = gateway.handleLeaveChat(mockClient, 'chat-id');

      expect(result).toEqual({
        success: true,
        chatId: 'chat-id',
      });
      expect(mockClient.leave).toHaveBeenCalledWith('chat:chat-id');
    });
  });

  describe('handleSendMessage', () => {
    it('should return success response with message data', async () => {
      const mockClient = {
        user: { id: '1', email: 'test@example.com', role: PrismaRole.CLIENT },
      } as unknown as AuthenticatedSocket;

      const mockMessage = {
        id: 'msg-1',
        text: 'Hello',
        senderId: '1',
        chatId: 'chat-id',
        createdAt: new Date(),
        sender: {
          id: '1',
          email: 'test@example.com',
          role: PrismaRole.CLIENT,
          profile: null,
        },
        isReadByCurrentUser: false,
        replyToId: null,
        fileUrl: null,
        readByClient: false,
        readByAdmin: false,
      };

      jest.spyOn(prismaService.chat, 'findUnique').mockResolvedValue(mockChat);
      jest.spyOn(chatService, 'createMessage').mockResolvedValue(mockMessage);

      const result = await gateway.handleSendMessage(mockClient, {
        chatId: 'chat-id',
        text: 'Hello',
      });

      expect(result).toEqual({
        success: true,
        message: mockMessage,
      });
    });

    it('should throw error for non-existent chat', async () => {
      const mockClient = {
        user: { id: '1', email: 'test@example.com', role: PrismaRole.CLIENT },
      } as unknown as AuthenticatedSocket;

      jest.spyOn(prismaService.chat, 'findUnique').mockResolvedValue(null);

      await expect(gateway.handleSendMessage(mockClient, {
        chatId: 'chat-id',
        text: 'Hello',
      })).rejects.toThrow('Chat not found');
    });
  });

  describe('handleReadMessages', () => {
    it('should return success response', async () => {
      const mockClient = {
        user: { id: '1', email: 'test@example.com', role: PrismaRole.CLIENT },
      } as unknown as AuthenticatedSocket;

      jest.spyOn(chatService, 'markMessagesAsRead').mockResolvedValue(undefined);

      const result = await gateway.handleReadMessages(mockClient, {
        chatId: 'chat-id',
        messageIds: ['msg-1', 'msg-2'],
      });

      expect(result).toEqual({
        success: true,
        chatId: 'chat-id',
        messageIds: ['msg-1', 'msg-2'],
      });
    });

    it('should throw error for invalid payload', async () => {
      const mockClient = {
        user: { id: '1', email: 'test@example.com', role: PrismaRole.CLIENT },
      } as unknown as AuthenticatedSocket;

      await expect(gateway.handleReadMessages(mockClient, {
        chatId: '',
        messageIds: [],
      })).rejects.toThrow('Invalid payload for readMessages');
    });
  });

  describe('handleGetActiveUsers', () => {
    it('should return active users for chat', () => {
      const mockClient = {
        user: { id: '1', email: 'test@example.com', role: PrismaRole.CLIENT },
      } as unknown as AuthenticatedSocket;

      // Mock chatRooms private property
      const chatRooms = new Map();
      chatRooms.set('chat-id', new Set(['1', '2']));
      (gateway as any).chatRooms = chatRooms;

      const result = gateway.handleGetActiveUsers(mockClient, 'chat-id');

      expect(result).toEqual({
        success: true,
        chatId: 'chat-id',
        userIds: ['1', '2'],
      });
    });

    it('should return empty array for non-existent chat', () => {
      const mockClient = {
        user: { id: '1', email: 'test@example.com', role: PrismaRole.CLIENT },
      } as unknown as AuthenticatedSocket;

      const result = gateway.handleGetActiveUsers(mockClient, 'non-existent-chat');

      expect(result).toEqual({
        success: true,
        chatId: 'non-existent-chat',
        userIds: [],
      });
    });
  });

  describe('notifyNewMessage', () => {
    it('should emit new message to chat room', () => {
      const chatId = 'chat-id';
      const message = {
        id: 'message-id',
        text: 'Hello',
        senderId: '1',
        sender: {
          id: '1',
          email: 'user@example.com',
          role: PrismaRole.CLIENT,
          profile: null,
        },
        createdAt: new Date(),
        chatId: 'chat-id',
        replyToId: null,
        fileUrl: null,
        readBy: [],
      };

      gateway.notifyNewMessage(chatId, message);

      expect(gateway.server.to).toHaveBeenCalledWith(`chat:${chatId}`);
      expect(gateway.server.to(`chat:${chatId}`).emit).toHaveBeenCalledWith(
        'newMessage',
        message,
      );
    });
  });

  describe('notifyChatStatusChange', () => {
    it('should emit status change to chat room', () => {
      const chatId = 'chat-id';
      const status = ChatStatus.CLOSED;

      gateway.notifyChatStatusChange(chatId, status);

      expect(gateway.server.to).toHaveBeenCalledWith(`chat:${chatId}`);
      expect(gateway.server.to(`chat:${chatId}`).emit).toHaveBeenCalledWith(
        'chatStatusChanged',
        { chatId, status },
      );
    });
  });
});
