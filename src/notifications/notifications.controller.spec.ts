import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Role } from '../common/enum/roles.enum';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: {
    getUnreadMessagesCount: jest.Mock;
    getPendingApplicationsCount: jest.Mock;
    getSummary: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getUnreadMessagesCount: jest.fn(),
      getPendingApplicationsCount: jest.fn(),
      getSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: service },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('returns unread messages count for current user', async () => {
    service.getUnreadMessagesCount.mockResolvedValue(5);

    const result = await controller.getUnreadMessagesCount({
      user: { userId: 'user-1', role: Role.CLIENT },
    });

    expect(service.getUnreadMessagesCount).toHaveBeenCalledWith(
      'user-1',
      Role.CLIENT,
    );
    expect(result).toEqual({ count: 5 });
  });

  it('returns pending applications count for current user', async () => {
    service.getPendingApplicationsCount.mockResolvedValue(2);

    const result = await controller.getPendingApplicationsCount({
      user: { userId: 'admin-1', role: Role.ADMIN },
    });

    expect(service.getPendingApplicationsCount).toHaveBeenCalledWith(
      'admin-1',
      Role.ADMIN,
    );
    expect(result).toEqual({ count: 2 });
  });

  it('returns summary payload', async () => {
    service.getSummary.mockResolvedValue({
      unreadMessages: 4,
      pendingApplications: 1,
    });

    const result = await controller.getSummary({
      user: { userId: 'user-1', role: Role.CLIENT },
    });

    expect(service.getSummary).toHaveBeenCalledWith('user-1', Role.CLIENT);
    expect(result).toEqual({ unreadMessages: 4, pendingApplications: 1 });
  });
});
