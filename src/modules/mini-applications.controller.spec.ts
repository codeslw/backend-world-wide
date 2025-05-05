import { Test, TestingModule } from '@nestjs/testing';
import { MiniApplicationsController } from './mini-applications.controller';

describe('MiniApplicationsController', () => {
  let controller: MiniApplicationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MiniApplicationsController],
    }).compile();

    controller = module.get<MiniApplicationsController>(MiniApplicationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
