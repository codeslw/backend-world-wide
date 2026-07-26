import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UniversitiesService } from './universities.service';
import { PrismaService } from '../db/prisma.service';
import { UniversitiesMapper } from './universities.mapper';
import { UniversitiesRepository } from './universities.repository';
import { IntakesService } from '../intakes/intakes.service';

describe('UniversitiesService', () => {
  let service: UniversitiesService;

  // The service mutates a single `dataToUpdate` object and hands that same
  // reference to `update()`, so jest's recorded arguments would reflect any
  // later mutation. Snapshot the payload at call time to assert on what was
  // actually sent to Prisma.
  let updatePayloads: any[] = [];

  const tx = {
    university: {
      update: jest.fn((args: any) => {
        updatePayloads.push(JSON.parse(JSON.stringify(args)));
        return Promise.resolve({ id: 'uni-1' });
      }),
      findUnique: jest.fn(),
    },
    admissionRequirement: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  const mockPrismaService = {
    university: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
  };

  const mockMapper = { toResponseDto: jest.fn((u) => u) };
  const mockRepository = {};
  const mockIntakesService = {};
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniversitiesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UniversitiesMapper, useValue: mockMapper },
        { provide: UniversitiesRepository, useValue: mockRepository },
        { provide: IntakesService, useValue: mockIntakesService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<UniversitiesService>(UniversitiesService);
    updatePayloads = [];

    mockPrismaService.university.findUnique.mockResolvedValue({
      id: 'uni-1',
      isMain: false,
      universityPrograms: [],
    });
    tx.university.findUnique.mockResolvedValue({ id: 'uni-1' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('update', () => {
    // Regression: agencyServiceId used to be applied to the update payload
    // *after* tx.university.update had already run, making the change a no-op.
    it('connects the agency service in the same update call', async () => {
      await service.update('uni-1', { agencyServiceId: 'service-1' });

      expect(updatePayloads).toHaveLength(1);
      expect(updatePayloads[0].where).toEqual({ id: 'uni-1' });
      expect(updatePayloads[0].data.agencyService).toEqual({
        connect: { id: 'service-1' },
      });
    });

    it('disconnects the agency service when explicitly cleared', async () => {
      await service.update('uni-1', { agencyServiceId: null as any });

      expect(updatePayloads[0].data.agencyService).toEqual({
        disconnect: true,
      });
    });

    it('leaves the agency service untouched when the field is omitted', async () => {
      await service.update('uni-1', { name: 'Renamed' } as any);

      expect(updatePayloads[0].data).not.toHaveProperty('agencyService');
    });
  });
});
