import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../db/prisma.service';
import { FilesService } from '../files/files.service';
import { ChatGateway } from './chat.gateway';
import { Role } from '../common/enum/roles.enum';
import { ChatStatus } from '../common/enum/chat.enum';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;
  let prismaService: PrismaService;
  let filesService: FilesService;
  let chatGateway: ChatGateway;

  const mockPrismaService = {
    chat: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockFilesService = {
    getFile: jest.fn(),
  };

  const mockChatGateway = {
    notifyNewMessage: jest.fn(),
    notifyChatStatusChange: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { 
          provide: PrismaService, 
          useValue: mockPrismaService 
        },
        { 
          provide: FilesService, 
          useValue: mockFilesService 
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prismaService = module.get<PrismaService>(PrismaService);
    filesService = module.get<FilesService>(FilesService);
    
    // Set the chat gateway manually
    service.setChatGateway(mockChatGateway as unknown as ChatGateway);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createChat', () => {
    it('should create a new chat', async () => {
      const userId = 'user-id';
      const createChatDto = { initialMessage: 'Hello' };
      
      const mockChat = {
        id: 'chat-id',
        clientId: userId,
        status: 'ACTIVE',
      };
      
      const mockMessage = {
        id: 'message-id',
        text: createChatDto.initialMessage,
        chatId: mockChat.id,
        senderId: userId,
      };
      
      mockPrismaService.chat.create.mockResolvedValue(mockChat);
      mockPrismaService.chat.findUnique.mockResolvedValue({
        ...mockChat,
        messages: [mockMessage],
      });
      mockPrismaService.message.create.mockResolvedValue(mockMessage);
      
      const result = await service.createChat(userId, createChatDto);
      
      expect(mockPrismaService.chat.create).toHaveBeenCalledWith({
        data: { clientId: userId },
      });
      expect(result).toEqual({ ...mockChat, messages: [mockMessage] });
    });
  });

  describe('getChatById', () => {
    it('should return a chat by id', async () => {
      const chatId = 'chat-id';
      const userId = 'user-id';
      const mockChat = {
        id: chatId,
        clientId: userId,
        messages: [{ id: 'message-id', createdAt: new Date() }],
      };
      
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);
      
      const result = await service.getChatById(chatId, userId, Role.CLIENT);
      
      expect(mockPrismaService.chat.findUnique).toHaveBeenCalledWith({
        where: { id: chatId },
        include: expect.any(Object),
      });
      expect(result).toEqual({
        ...mockChat,
        messages: expect.any(Array),
      });
    });

    it('should throw NotFoundException if chat not found', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(null);
      
      await expect(service.getChatById('non-existent', 'user-id', Role.CLIENT))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      const mockChat = {
        id: 'chat-id',
        clientId: '2', // Different from userId
        adminId: '3',   // Different from userId
      };
      
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);
      
      await expect(service.getChatById('chat-id', 'user-id', Role.CLIENT))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('createMessage', () => {
    it('should create a message in a chat', async () => {
      const userId = 'user-id';
      const chatId = 'chat-id';
      const createMessageDto = { 
        chatId,
        text: 'Hello',
      };
      
      const mockChat = {
        id: chatId,
        clientId: userId,
        status: ChatStatus.ACTIVE,
      };
      
      const mockMessage = {
        id: 'message-id',
        chatId,
        senderId: userId,
        text: 'Hello',
      };
      
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);
      mockPrismaService.message.create.mockResolvedValue(mockMessage);
      
      const result = await service.createMessage(userId, Role.CLIENT, createMessageDto);
      
      expect(mockPrismaService.message.create).toHaveBeenCalled();
      expect(mockChatGateway.notifyNewMessage).toHaveBeenCalledWith(chatId, mockMessage);
      expect(result).toEqual(mockMessage);
    });
  });

  describe('updateChatStatus', () => {
    it('should update chat status', async () => {
      const chatId = 'chat-id';
      const userId = 'user-id';
      const updateDto = { status: ChatStatus.CLOSED };
      
      const mockChat = {
        id: chatId,
        clientId: userId,
        adminId: userId,
        status: ChatStatus.ACTIVE,
      };
      
      const updatedChat = {
        ...mockChat,
        status: ChatStatus.CLOSED,
      };
      
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);
      mockPrismaService.chat.update.mockResolvedValue(updatedChat);
      
      const result = await service.updateChatStatus(chatId, userId, Role.ADMIN, updateDto);
      
      expect(mockPrismaService.chat.update).toHaveBeenCalled();
      expect(mockChatGateway.notifyChatStatusChange).toHaveBeenCalledWith(chatId, updateDto.status);
      expect(result).toEqual(updatedChat);
    });
  });
}); 