import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { ApplicationsRepository } from './applications.repository';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationStatus } from './enums/application.enum';
import { EntityNotFoundException, ForbiddenActionException } from '../common/exceptions/app.exceptions';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let applicationsRepository: ApplicationsRepository;
  let profilesService: ProfilesService;

  // Mock data
  const mockUser = { id: 'user1' };
  const mockProfile = { id: 'profile1', userId: 'user1' };
  const mockApplication = {
    id: 'app1',
    profileId: 'profile1',
    profile: { userId: 'user1' },
    applicationStatus: ApplicationStatus.DRAFT
  };

  // Mock repositories
  const mockApplicationsRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByProfileId: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockProfilesService = {
    findByUserId: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: ApplicationsRepository,
          useValue: mockApplicationsRepository,
        },
        {
          provide: ProfilesService,
          useValue: mockProfilesService,
        },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    applicationsRepository = module.get<ApplicationsRepository>(ApplicationsRepository);
    profilesService = module.get<ProfilesService>(ProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw EntityNotFoundException when profile not found', async () => {
      // Arrange
      mockProfilesService.findByUserId.mockResolvedValue(null);
      
      const createDto = new CreateApplicationDto();

      // Act & Assert
      await expect(service.create(mockUser.id, createDto))
        .rejects
        .toThrow(EntityNotFoundException);
    });

    it('should create an application when profile exists', async () => {
      // Arrange
      mockProfilesService.findByUserId.mockResolvedValue(mockProfile);
      mockApplicationsRepository.create.mockResolvedValue(mockApplication);
      
      const createDto = new CreateApplicationDto();

      // Act
      const result = await service.create(mockUser.id, createDto);

      // Assert
      expect(result).toEqual(mockApplication);
      expect(mockProfilesService.findByUserId).toHaveBeenCalledWith(mockUser.id);
      expect(mockApplicationsRepository.create).toHaveBeenCalledWith(mockProfile.id, createDto);
    });
  });

  describe('update', () => {
    it('should throw EntityNotFoundException when application not found', async () => {
      // Arrange
      mockApplicationsRepository.findById.mockResolvedValue(null);
      
      const updateDto = {};

      // Act & Assert
      await expect(service.update('nonexistent-id', mockUser.id, updateDto))
        .rejects
        .toThrow(EntityNotFoundException);
    });

    it('should throw ForbiddenActionException when user does not own the application', async () => {
      // Arrange
      const differentUser = { id: 'user2' };
      const mockApplicationWithDifferentOwner = {
        ...mockApplication,
        profile: { userId: 'user1' }
      };
      
      mockApplicationsRepository.findById.mockResolvedValue(mockApplicationWithDifferentOwner);
      mockProfilesService.findByUserId.mockResolvedValue({ id: 'profile2', userId: 'user2' });
      
      const updateDto = {};

      // Act & Assert
      await expect(service.update('app1', differentUser.id, updateDto))
        .rejects
        .toThrow(ForbiddenActionException);
    });
  });

  describe('remove', () => {
    it('should throw EntityNotFoundException when application not found', async () => {
      // Arrange
      mockApplicationsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('nonexistent-id', mockUser.id))
        .rejects
        .toThrow(EntityNotFoundException);
    });

    it('should throw ForbiddenActionException when application is not in DRAFT status', async () => {
      // Arrange
      const submittedApplication = {
        ...mockApplication,
        applicationStatus: ApplicationStatus.SUBMITTED
      };
      
      mockApplicationsRepository.findById.mockResolvedValue(submittedApplication);
      mockProfilesService.findByUserId.mockResolvedValue(mockProfile);

      // Act & Assert
      await expect(service.remove('app1', mockUser.id))
        .rejects
        .toThrow(ForbiddenActionException);
    });
  });

  describe('submit', () => {
    it('should throw EntityNotFoundException when application not found', async () => {
      // Arrange
      mockApplicationsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.submit('nonexistent-id', mockUser.id))
        .rejects
        .toThrow(EntityNotFoundException);
    });

    it('should throw ForbiddenActionException when application is not in DRAFT status', async () => {
      // Arrange
      const submittedApplication = {
        ...mockApplication,
        applicationStatus: ApplicationStatus.SUBMITTED
      };
      
      mockApplicationsRepository.findById.mockResolvedValue(submittedApplication);
      mockProfilesService.findByUserId.mockResolvedValue(mockProfile);

      // Act & Assert
      await expect(service.submit('app1', mockUser.id))
        .rejects
        .toThrow(ForbiddenActionException);
    });

    it('should successfully submit a draft application', async () => {
      // Arrange
      mockApplicationsRepository.findById.mockResolvedValue(mockApplication);
      mockProfilesService.findByUserId.mockResolvedValue(mockProfile);
      
      const updatedApplication = {
        ...mockApplication,
        applicationStatus: ApplicationStatus.SUBMITTED,
        submittedAt: expect.any(Date)
      };
      
      mockApplicationsRepository.update.mockResolvedValue(updatedApplication);

      // Act
      const result = await service.submit('app1', mockUser.id);

      // Assert
      expect(result).toEqual(updatedApplication);
      expect(mockApplicationsRepository.update).toHaveBeenCalledWith('app1', {
        applicationStatus: ApplicationStatus.SUBMITTED,
        submittedAt: expect.any(Date)
      });
    });
  });
}); 