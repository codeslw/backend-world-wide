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
              if (key === 'DIGITAL_OCEAN_ENDPOINT')
                return 'https://blr1.digitaloceanspaces.com';
              if (key === 'DIGITAL_OCEAN_ACCESS_KEY') return 'test-key';
              if (key === 'DIGITAL_OCEAN_SECRET_KEY') return 'test-secret';
              if (key === 'DIGITAL_OCEAN_BUCKET') return 'worldwideuz';
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

  it('should normalize a path-style signed Spaces URL to a public URL', () => {
    const url =
      'https://blr1.digitaloceanspaces.com/worldwideuz/uploads/image%20(1).png?AWSAccessKeyId=test&Expires=1&Signature=test';

    expect(service.normalizeToPublicUrl(url)).toBe(
      'https://worldwideuz.blr1.digitaloceanspaces.com/uploads/image%20(1).png',
    );
  });

  it('should keep external image URLs unchanged', () => {
    const url = 'https://example.com/uploads/image.png?token=abc';

    expect(service.normalizeToPublicUrl(url)).toBe(url);
  });
});
