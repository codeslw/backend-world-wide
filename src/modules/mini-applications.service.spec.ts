import { Test, TestingModule } from '@nestjs/testing';
import { MiniApplicationsService } from './mini-applications.service';

describe('MiniApplicationsService', () => {
  let service: MiniApplicationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MiniApplicationsService],
    }).compile();

    service = module.get<MiniApplicationsService>(MiniApplicationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
