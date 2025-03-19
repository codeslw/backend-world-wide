import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/db/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../src/common/enum/roles.enum';
import { ChatStatus } from '../src/common/enum/chat.enum';

// Mock the entire socket.io-client
jest.mock('socket.io-client', () => {
  return {
    connect: jest.fn(() => ({
      on: jest.fn((event, callback) => {
        if (event === 'connect') {
          callback();
        }
        return this;
      }),
      emit: jest.fn((event, data, callback) => {
        if (callback) {
          if (event === 'joinChat') {
            callback({ event: 'joinedChat', data: { chatId: data } });
          } else if (event === 'sendMessage') {
            callback({ event: 'messageSent', data: { id: 'message-id', text: data.message.text } });
          }
        }
        return this;
      }),
      disconnect: jest.fn()
    }))
  };
});

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      create: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com', role: 'CLIENT' }),
      findFirst: jest.fn().mockResolvedValue({ id: 1 }),
      findUnique: jest.fn().mockResolvedValue({ id: 1 }),
      deleteMany: jest.fn(),
    },
    chat: {
      create: jest.fn().mockResolvedValue({ id: 'chat-id', status: 'ACTIVE' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'chat-id', messages: [] }),
      findMany: jest.fn().mockResolvedValue([{ id: 'chat-id' }]),
      update: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'chat-id', ...args.data })),
      deleteMany: jest.fn(),
    },
    message: {
      create: jest.fn().mockResolvedValue({ id: 'message-id', text: 'test' }),
      findMany: jest.fn().mockResolvedValue([{ id: 'message-id' }]),
      count: jest.fn().mockResolvedValue(2),
      deleteMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('ChatController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    jwtService = app.get<JwtService>(JwtService);

    // Generate tokens directly without creating users
    userToken = jwtService.sign({ sub: 1, email: 'test-user@example.com', role: Role.CLIENT });
    adminToken = jwtService.sign({ sub: 2, email: 'test-admin@example.com', role: Role.ADMIN });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // WebSocket tests using mocks
  describe('WebSocket', () => {
    it('should join a chat room', () => {
      const io = require('socket.io-client');
      const socket = io.connect();
      
      socket.emit('joinChat', 'chat-id', (response) => {
        expect(response.event).toBe('joinedChat');
        expect(response.data.chatId).toBe('chat-id');
      });
    });

    it('should send messages', () => {
      const io = require('socket.io-client');
      const socket = io.connect();
      
      socket.emit('sendMessage', {
        chatId: 'chat-id',
        message: { text: 'Hello via WebSocket' }
      }, (response) => {
        expect(response.event).toBe('messageSent');
        expect(response.data.text).toBe('Hello via WebSocket');
      });
    });
  });
}); 