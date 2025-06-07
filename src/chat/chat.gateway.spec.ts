import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../db/prisma.service';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { Role } from '../common/enum/roles.enum';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  const mockChatService = {
    getChatMessages: jest.fn(),
    createMessage: jest.fn(),
    markMessagesAsRead: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn().mockReturnValue({ sub: 1 }),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 1, email: 'test@example.com', role: 'USER' }),
    },
    chat: {
      findUnique: jest.fn().mockResolvedValue({ id: 'chat-id' }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: 'CHAT_SERVICE_PROVIDER',
          useValue: {
            getChatMessages: jest.fn(),
            createMessage: jest.fn(),
            markMessagesAsRead: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn().mockReturnValue({ sub: 1 }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue({
                id: 1,
                email: 'test@example.com',
                role: 'USER',
              }),
            },
            chat: {
              findUnique: jest.fn().mockResolvedValue({ id: 'chat-id' }),
            },
          },
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);

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
      } as unknown as Socket;

      const mockUser = {
        id: '1',
        email: 'user@example.com',
        role: Role.CLIENT,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 1 });
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      await gateway.handleConnection(mockClient);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockClient.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect if token is invalid', async () => {
      const mockClient = {
        handshake: {
          auth: { token: 'invalid-token' },
        },
        disconnect: jest.fn(),
      } as unknown as Socket;

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(mockClient);

      expect(mockClient.disconnect).toHaveBeenCalled();
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
          role: Role.CLIENT,
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
      const status = 'CLOSED';

      gateway.notifyChatStatusChange(chatId, status);

      expect(gateway.server.to).toHaveBeenCalledWith(`chat:${chatId}`);
      expect(gateway.server.to(`chat:${chatId}`).emit).toHaveBeenCalledWith(
        'chatStatusChanged',
        { chatId, status },
      );
    });
  });
});
