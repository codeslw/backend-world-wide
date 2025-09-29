import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../db/prisma.service';
import { Role } from '../common/enum/roles.enum';
import { ApplicationStatus } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaMock: {
    message: { count: jest.Mock };
    application: { count: jest.Mock };
    profile: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prismaMock = {
      message: { count: jest.fn() },
      application: { count: jest.fn() },
      profile: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns unread message count for client chats', async () => {
    prismaMock.message.count.mockResolvedValue(4);

    const result = await service.getUnreadMessagesCount('user-1', Role.CLIENT);

    expect(result).toBe(4);
    expect(prismaMock.message.count).toHaveBeenCalledWith({
      where: {
        chat: { clientId: 'user-1' },
        senderId: { not: 'user-1' },
        readByClient: false,
      },
    });
  });

  it('returns unread message count for admins including unassigned chats', async () => {
    prismaMock.message.count.mockResolvedValue(7);

    const result = await service.getUnreadMessagesCount('admin-1', Role.ADMIN);

    expect(result).toBe(7);
    expect(prismaMock.message.count).toHaveBeenCalledWith({
      where: {
        chat: {
          OR: [{ adminId: 'admin-1' }, { adminId: null }],
        },
        senderId: { not: 'admin-1' },
        readByAdmin: false,
      },
    });
  });

  it('returns pending applications count for client profile', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ id: 'profile-1' });
    prismaMock.application.count.mockResolvedValue(3);

    const result = await service.getPendingApplicationsCount(
      'user-1',
      Role.CLIENT,
    );

    expect(prismaMock.profile.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { id: true },
    });
    expect(prismaMock.application.count).toHaveBeenCalledWith({
      where: {
        profileId: 'profile-1',
        applicationStatus: {
          in: [ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED],
        },
      },
    });
    expect(result).toBe(3);
  });

  it('returns zero pending applications when client has no profile', async () => {
    prismaMock.profile.findUnique.mockResolvedValue(null);

    const result = await service.getPendingApplicationsCount(
      'user-1',
      Role.CLIENT,
    );

    expect(result).toBe(0);
    expect(prismaMock.application.count).not.toHaveBeenCalled();
  });
});
