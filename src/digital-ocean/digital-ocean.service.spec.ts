import { Test, TestingModule } from '@nestjs/testing';
import { DigitalOceanService } from './digital-ocean.service';
import { ConfigService } from '@nestjs/config';

describe('DigitalOceanService', () => {
  let service: DigitalOceanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DigitalOceanService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'DO_SPACES_ENDPOINT') return 'test-endpoint';
              if (key === 'DO_SPACES_KEY') return 'test-key';
              if (key === 'DO_SPACES_SECRET') return 'test-secret';
              if (key === 'DO_SPACES_BUCKET') return 'test-bucket';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DigitalOceanService>(DigitalOceanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
