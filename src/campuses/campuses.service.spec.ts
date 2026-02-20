import { Test, TestingModule } from '@nestjs/testing';
import { CampusesService } from './campuses.service';
import { PrismaService } from '../db/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CampusStatus } from '@prisma/client';

describe('CampusesService', () => {
  let service: CampusesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    university: {
      findUnique: jest.fn(),
    },
    campus: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCampus = {
    id: 'campus-1',
    universityId: 'uni-1',
    name: 'Main Campus',
    address: '123 Uni Street',
    status: CampusStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampusesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CampusesService>(CampusesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a campus if university exists', async () => {
      mockPrismaService.university.findUnique.mockResolvedValueOnce({
        id: 'uni-1',
      });
      mockPrismaService.campus.create.mockResolvedValueOnce(mockCampus);

      const dto = {
        universityId: 'uni-1',
        name: 'Main Campus',
        address: '123 Uni Street',
        status: CampusStatus.ACTIVE,
      };
      const result = await service.create(dto);

      expect(prismaService.university.findUnique).toHaveBeenCalledWith({
        where: { id: 'uni-1' },
      });
      expect(prismaService.campus.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(mockCampus);
    });

    it('should throw NotFoundException if university does not exist', async () => {
      mockPrismaService.university.findUnique.mockResolvedValueOnce(null);

      const dto = {
        universityId: 'invalid-id',
        name: 'Main Campus',
        address: '123 Uni Street',
        status: CampusStatus.ACTIVE,
      };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(prismaService.campus.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all campuses without filter', async () => {
      mockPrismaService.campus.findMany.mockResolvedValueOnce([mockCampus]);

      const result = await service.findAll();

      expect(prismaService.campus.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockCampus]);
    });

    it('should return campuses for a specific university', async () => {
      mockPrismaService.campus.findMany.mockResolvedValueOnce([mockCampus]);

      const result = await service.findAll('uni-1');

      expect(prismaService.campus.findMany).toHaveBeenCalledWith({
        where: { universityId: 'uni-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockCampus]);
    });
  });

  describe('findOne', () => {
    it('should return a campus if found', async () => {
      mockPrismaService.campus.findUnique.mockResolvedValueOnce(mockCampus);

      const result = await service.findOne('campus-1');

      expect(prismaService.campus.findUnique).toHaveBeenCalledWith({
        where: { id: 'campus-1' },
        include: { university: { select: { id: true, name: true } } },
      });
      expect(result).toEqual(mockCampus);
    });

    it('should throw NotFoundException if campus is not found', async () => {
      mockPrismaService.campus.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('campus-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a campus', async () => {
      mockPrismaService.campus.findUnique.mockResolvedValueOnce(mockCampus);
      mockPrismaService.campus.update.mockResolvedValueOnce({
        ...mockCampus,
        name: 'Updated Campus',
      });

      const dto = { name: 'Updated Campus' };
      const result = await service.update('campus-1', dto);

      expect(prismaService.campus.update).toHaveBeenCalledWith({
        where: { id: 'campus-1' },
        data: dto,
      });
      expect(result.name).toEqual('Updated Campus');
    });
  });

  describe('remove', () => {
    it('should remove a campus', async () => {
      mockPrismaService.campus.findUnique.mockResolvedValueOnce(mockCampus);
      mockPrismaService.campus.delete.mockResolvedValueOnce(mockCampus);

      const result = await service.remove('campus-1');

      expect(prismaService.campus.delete).toHaveBeenCalledWith({
        where: { id: 'campus-1' },
      });
      expect(result).toEqual(mockCampus);
    });
  });
});
