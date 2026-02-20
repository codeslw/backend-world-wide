import { Test, TestingModule } from '@nestjs/testing';
import { CampusesController } from './campuses.controller';
import { CampusesService } from './campuses.service';
import { CampusStatus } from '@prisma/client';

describe('CampusesController', () => {
  let controller: CampusesController;
  let service: CampusesService;

  const mockCampus = {
    id: 'campus-1',
    universityId: 'uni-1',
    name: 'Main Campus',
    address: '123 Uni Street',
    status: CampusStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCampusesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampusesController],
      providers: [
        {
          provide: CampusesService,
          useValue: mockCampusesService,
        },
      ],
    }).compile();

    controller = module.get<CampusesController>(CampusesController);
    service = module.get<CampusesService>(CampusesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a campus', async () => {
      mockCampusesService.create.mockResolvedValueOnce(mockCampus);
      const dto = {
        universityId: 'uni-1',
        name: 'Main Campus',
        address: '123 Uni Street',
        status: CampusStatus.ACTIVE,
      };
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCampus);
    });
  });

  describe('findAll', () => {
    it('should return all campuses', async () => {
      mockCampusesService.findAll.mockResolvedValueOnce([mockCampus]);
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([mockCampus]);
    });

    it('should return campuses by universityId', async () => {
      mockCampusesService.findAll.mockResolvedValueOnce([mockCampus]);
      const result = await controller.findAll('uni-1');
      expect(service.findAll).toHaveBeenCalledWith('uni-1');
      expect(result).toEqual([mockCampus]);
    });
  });

  describe('findOne', () => {
    it('should return a campus by ID', async () => {
      mockCampusesService.findOne.mockResolvedValueOnce(mockCampus);
      const result = await controller.findOne('campus-1');
      expect(service.findOne).toHaveBeenCalledWith('campus-1');
      expect(result).toEqual(mockCampus);
    });
  });

  describe('update', () => {
    it('should update a campus', async () => {
      mockCampusesService.update.mockResolvedValueOnce(mockCampus);
      const dto = { name: 'Updated Campus' };
      const result = await controller.update('campus-1', dto);
      expect(service.update).toHaveBeenCalledWith('campus-1', dto);
      expect(result).toEqual(mockCampus);
    });
  });

  describe('remove', () => {
    it('should remove a campus', async () => {
      mockCampusesService.remove.mockResolvedValueOnce(mockCampus);
      const result = await controller.remove('campus-1');
      expect(service.remove).toHaveBeenCalledWith('campus-1');
      expect(result).toEqual(mockCampus);
    });
  });
});
