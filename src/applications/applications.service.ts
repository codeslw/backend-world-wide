import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApplicationsRepository } from './applications.repository';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { ApplicationStatus } from '@prisma/client';
import { 
  EntityNotFoundException,
  ForbiddenActionException,
  InvalidDataException
} from '../common/exceptions/app.exceptions';
import { Role } from '../common/enum/roles.enum';
import { ApplicationResponseDto } from './dto/application-response.dto';
import { wrap } from 'class-transformer';
import { forwardRef } from '@nestjs/common';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applicationsRepository: ApplicationsRepository,
    @Inject(forwardRef(() => ProfilesService))
    private readonly profilesService: ProfilesService,
  ) {}

  async create(userId: string, createApplicationDto: CreateApplicationDto): Promise<ApplicationResponseDto> {
    try {
      // Get the profile for the user
      const profile = await this.profilesService.findByUserId(userId);
      if (!profile) {
        throw new EntityNotFoundException('Profile', userId);
      }

      const applicationData = {
        ...createApplicationDto,
        profile: profile, // Assign the fetched profile entity
        submittedAt: null, // Ensure submittedAt is null on creation
        reviewedAt: null,
      };

      const application = await this.applicationsRepository.create(applicationData);
      await this.applicationsRepository.persistAndFlush(application);
      return this.mapToResponseDto(application);
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      throw new InvalidDataException('Failed to create application', error.message);
    }
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: any;
    includeProfile?: boolean;
  }): Promise<ApplicationResponseDto[]> {
    try {
      const applications = await this.applicationsRepository.findAll(options);
      return applications.map((app) => this.mapToResponseDto(app));
    } catch (error) {
      throw new InvalidDataException('Failed to retrieve applications', error.message);
    }
  }

  async findAllByUserId(userId: string): Promise<ApplicationResponseDto[]> {
    const profile = await this.profilesService.findOneByUserId(userId);
    if (!profile) {
      // Or return empty array if profile not found indicates no applications
      return [];
    }
    // Assuming repository has a method to find by profile ID
    const applications = await this.applicationsRepository.findAllByProfileId(
      profile.id,
    );
    return applications.map((app) => this.mapToResponseDto(app));
  }

  /**
   * Finds all applications submitted by a specific client.
   * @param clientId The ID of the client user.
   * @returns A promise resolving to an array of ApplicationResponseDto.
   */
  async findMyApplications(clientId: string): Promise<ApplicationResponseDto[]> {
    const profile = await this.profilesService.findOneByUserId(clientId);
    if (!profile) {
      // If the client has no profile, they cannot have applications.
      return [];
    }
    // Reuse the existing repository method
    const applications = await this.applicationsRepository.findAllByProfileId(
      profile.id,
    );
    return applications.map((app) => this.mapToResponseDto(app));
  }

  async count(where?: any): Promise<number> {
    try {
      return this.applicationsRepository.count(where);
    } catch (error) {
      throw new InvalidDataException('Failed to count applications', error.message);
    }
  }

  async findOne(id: string, includeProfile = true): Promise<ApplicationResponseDto> {
    try {
      const application = await this.applicationsRepository.findById(
        id,
        includeProfile,
      );
      if (!application) {
        throw new EntityNotFoundException('Application', id);
      }
      return this.mapToResponseDto(application);
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      throw new InvalidDataException('Failed to retrieve application', error.message);
    }
  }

  async update(
    id: string,
    userId: string,
    updateApplicationDto: UpdateApplicationDto,
    isAdminUpdate: boolean = false, // Flag to differentiate admin updates
  ): Promise<ApplicationResponseDto> {
    try {
      // Verify the application exists
      const application = await this.findOne(id);

      // Get the user's profile
      const profile = await this.profilesService.findByUserId(userId);
      if (!profile) {
        throw new EntityNotFoundException('Profile', userId);
      }

      // Check if this application belongs to the user's profile
      if (application.profileId !== profile.id) {
        throw new ForbiddenActionException(
          'You do not have permission to update this application',
        );
      }

      // Only allow client to update before submission, unless it's an admin update
      if (
        !isAdminUpdate &&
        application.applicationStatus !== ApplicationStatus.DRAFT &&
        application.applicationStatus !== ApplicationStatus.REJECTED // Allow update if rejected
      ) {
        throw new ForbiddenActionException(
          'Application cannot be updated after submission unless by an admin.',
        );
      }

      // If admin is updating, handle specific fields
      if (isAdminUpdate) {
        // Ensure only allowed fields are updated by admin
        const allowedAdminFields = [
          'applicationStatus',
          'assignedTo',
          'adminNotes',
          'reviewedAt',
        ];
        for (const key in updateApplicationDto) {
          if (!allowedAdminFields.includes(key)) {
            delete updateApplicationDto[key]; // Remove fields not allowed for admin update
          }
        }
        // Additional logic if status changes (e.g., set reviewedAt)
        if (updateApplicationDto.applicationStatus && !updateApplicationDto.reviewedAt) {
          if ([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED].includes(updateApplicationDto.applicationStatus)) {
            updateApplicationDto.reviewedAt = new Date();
          }
        }
      } else {
        // Client updates - ensure they cannot update admin-only fields
        const forbiddenClientFields = [
          'applicationStatus',
          'assignedTo',
          'adminNotes',
          'reviewedAt',
        ];
        for (const key of forbiddenClientFields) {
          if (key in updateApplicationDto) {
            throw new ForbiddenActionException(`Field '${key}' cannot be updated by the client.`);
          }
        }
      }

      // Apply updates
      wrap(application).assign(updateApplicationDto);
      await this.applicationsRepository.persistAndFlush(application);
      return this.mapToResponseDto(application);
    } catch (error) {
      if (error instanceof EntityNotFoundException || 
          error instanceof ForbiddenActionException) {
        throw error;
      }
      throw new InvalidDataException('Failed to update application', error.message);
    }
  }

  async remove(id: string, userId: string, role: Role): Promise<void> {
    try {
      // Verify the application exists
      const application = await this.findOne(id);

      // Get the user's profile
      const profile = await this.profilesService.findByUserId(userId);
      if (!profile) {
        throw new EntityNotFoundException('Profile', userId);
      }

      // Check if this application belongs to the user's profile
      if (application.profileId !== profile.id) {
        throw new ForbiddenActionException(
          'You do not have permission to delete this application',
        );
      }

      // Only allow deletion of applications in DRAFT state
      if (String(application.applicationStatus) !== 'DRAFT') {
        throw new ForbiddenActionException('Only draft applications can be deleted');
      }

      // Allow ADMIN to delete any application
      // Allow CLIENT to delete only their own DRAFT applications
      if (role === Role.CLIENT) {
        if (application.profileId !== profile.id) {
          throw new ForbiddenActionException(
            'You do not have permission to delete this application',
          );
        }
        if (application.applicationStatus !== ApplicationStatus.DRAFT) {
          throw new ForbiddenActionException(
            'Only DRAFT applications can be deleted by the client',
          );
        }
      }

      await this.applicationsRepository.remove(id);
    } catch (error) {
      if (error instanceof EntityNotFoundException || 
          error instanceof ForbiddenActionException) {
        throw error;
      }
      throw new InvalidDataException('Failed to delete application', error.message);
    }
  }

  async submit(id: string, userId: string) {
    try {
      // Verify the application exists
      const application = await this.findOne(id);

      // Get the user's profile
      const profile = await this.profilesService.findByUserId(userId);
      if (!profile) {
        throw new EntityNotFoundException('Profile', userId);
      }

      // Check if this application belongs to the user's profile
      if (application.profileId !== profile.id) {
        throw new ForbiddenActionException(
          'You do not have permission to submit this application',
        );
      }

      // Only allow submission of applications in DRAFT state
      if (application.applicationStatus !== ApplicationStatus.DRAFT) {
        throw new ForbiddenActionException('Only draft applications can be submitted');
      }

      return this.applicationsRepository.update(id, {
        applicationStatus: ApplicationStatus.SUBMITTED,
        submittedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof EntityNotFoundException || 
          error instanceof ForbiddenActionException) {
        throw error;
      }
      throw new InvalidDataException('Failed to submit application', error.message);
    }
  }

  private mapToResponseDto(application: Application): ApplicationResponseDto {
    const dto = new ApplicationResponseDto();
    dto.id = application.id;
    dto.profileId = application.profileId;
    dto.programId = application.programId;
    dto.applicationStatus = application.applicationStatus;
    dto.submissionDate = application.submittedAt;
    dto.reviewDate = application.reviewedAt;
    dto.createdAt = application.createdAt;
    dto.updatedAt = application.updatedAt;
    // Include profile details if needed and available
    if (application.profile) {
      // Map relevant profile fields if necessary, e.g., dto.applicantName = application.profile.fullName;
    }
    return dto;
  }
}
