import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApplicationsRepository } from './applications.repository';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { Application, ApplicationStatus, Prisma } from '@prisma/client';
import {
  EntityNotFoundException,
  ForbiddenActionException,
  InvalidDataException,
} from '../common/exceptions/app.exceptions';
import { Role } from '../common/enum/roles.enum';
import { ApplicationResponseDto } from './dto/application-response.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applicationsRepository: ApplicationsRepository,
    @Inject(forwardRef(() => ProfilesService))
    private readonly profilesService: ProfilesService,
  ) {}

  async create(
    userId: string,
    createApplicationDto: CreateApplicationDto,
  ): Promise<ApplicationResponseDto> {
    try {
      // Get the profile for the user
      const profile = await this.profilesService.findByUserId(userId);
      if (!profile) {
        throw new EntityNotFoundException('Profile', userId);
      }

      // Data for repository create method matches CreateApplicationDto structure
      // The repository handles date conversion and profile connection
      const application = await this.applicationsRepository.create(
        profile.id,
        createApplicationDto,
      );
      // No need for save/persistAndFlush after Prisma create
      return this.mapToResponseDto(application);
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      throw new InvalidDataException(
        'Failed to create application',
        error.message,
      );
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
      throw new InvalidDataException(
        'Failed to retrieve applications',
        error.message,
      );
    }
  }

  async findAllByUserId(userId: string): Promise<ApplicationResponseDto[]> {
    const profile = await this.profilesService.findByUserId(userId);
    if (!profile) {
      // Or return empty array if profile not found indicates no applications
      return [];
    }
    // Assuming repository has a method to find by profile ID
    const applications = await this.applicationsRepository.findByProfileId(
      profile.id,
    );
    return applications.map((app) => this.mapToResponseDto(app));
  }

  /**
   * Finds all applications submitted by a specific client.
   * @param clientId The ID of the client user.
   * @returns A promise resolving to an array of ApplicationResponseDto.
   */
  async findMyApplications(
    clientId: string,
  ): Promise<ApplicationResponseDto[]> {
    const profile = await this.profilesService.findByUserId(clientId);
    if (!profile) {
      // If the client has no profile, they cannot have applications.
      return [];
    }
    // Reuse the existing repository method
    const applications = await this.applicationsRepository.findByProfileId(
      profile.id,
    );
    return applications.map((app) => this.mapToResponseDto(app));
  }

  async count(where?: any): Promise<number> {
    try {
      return this.applicationsRepository.count(where);
    } catch (error) {
      throw new InvalidDataException(
        'Failed to count applications',
        error.message,
      );
    }
  }

  async findOne(
    id: string,
    includeProfile = true,
  ): Promise<ApplicationResponseDto> {
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
      throw new InvalidDataException(
        'Failed to retrieve application',
        error.message,
      );
    }
  }

  async update(
    id: string,
    userId: string,
    updateApplicationDto: UpdateApplicationDto,
    isAdminUpdate: boolean = false, // Flag to differentiate admin updates
  ): Promise<ApplicationResponseDto> {
    try {
      // Fetch the actual entity to update
      const applicationEntity = await this.applicationsRepository.findById(id);
      if (!applicationEntity) {
        throw new EntityNotFoundException('Application', id);
      }

      // Get the user's profile
      const profile = await this.profilesService.findByUserId(userId);
      if (!profile) {
        throw new EntityNotFoundException('Profile', userId);
      }

      // Check if this application belongs to the user's profile
      if (applicationEntity.profileId !== profile.id) {
        throw new ForbiddenActionException(
          'You do not have permission to update this application',
        );
      }

      // Only allow client to update before submission, unless it's an admin update
      if (
        !isAdminUpdate &&
        applicationEntity.applicationStatus !== ApplicationStatus.DRAFT &&
        applicationEntity.applicationStatus !== ApplicationStatus.REJECTED // Allow update if rejected
      ) {
        throw new ForbiddenActionException(
          'Application cannot be updated after submission unless by an admin.',
        );
      }

      // Determine the DTO to pass to the repository update method
      const dtoForUpdate: UpdateApplicationDto = {};

      // If admin is updating, handle specific fields allowed via DTO
      if (isAdminUpdate) {
        // Only allow admin to update status via the DTO for now
        if (updateApplicationDto.applicationStatus) {
          // Check if the status change requires setting reviewedAt (handled in repository potentially)
          const statusToCheck = updateApplicationDto.applicationStatus;
          // Direct comparison for clarity and type safety
          if (
            statusToCheck === ApplicationStatus.APPROVED ||
            statusToCheck === ApplicationStatus.REJECTED
          ) {
            // We expect the repository or DB trigger to handle reviewedAt if needed
          }
          dtoForUpdate.applicationStatus =
            updateApplicationDto.applicationStatus;
        }
        // Admin cannot update other fields via this DTO based on current definitions
        // Need separate mechanism for adminNotes, assignedTo, etc.
      } else {
        // Client updates - Apply fields from UpdateApplicationDto, filtering forbidden ones
        const forbiddenClientFields: (keyof UpdateApplicationDto)[] = [
          'applicationStatus',
          'submittedAt', // Clients shouldn't directly set submission date via update
          // Add other potential forbidden fields if necessary
        ];

        // Copy allowed fields from input DTO
        for (const key in updateApplicationDto) {
          if (
            updateApplicationDto.hasOwnProperty(key) &&
            !forbiddenClientFields.includes(key as keyof UpdateApplicationDto)
          ) {
            (dtoForUpdate as any)[key] =
              updateApplicationDto[key as keyof UpdateApplicationDto];
          }
        }

        // Explicit check again to prevent accidental status updates
        if (dtoForUpdate.applicationStatus || dtoForUpdate.submittedAt) {
          throw new ForbiddenActionException(
            'Client cannot update status or submission date.',
          );
        }
      }

      // Perform the update using the repository with the prepared DTO
      const updatedApplication = await this.applicationsRepository.update(
        applicationEntity.id,
        dtoForUpdate, // Pass the UpdateApplicationDto
      );

      // Map the *updated entity* back to DTO
      return this.mapToResponseDto(updatedApplication);
    } catch (error) {
      if (
        error instanceof EntityNotFoundException ||
        error instanceof ForbiddenActionException
      ) {
        throw error;
      }
      throw new InvalidDataException(
        'Failed to update application',
        error.message,
      );
    }
  }

  async updateStatus(
    id: string,
    newStatus: ApplicationStatus,
    rejectionReason?: string,
  ): Promise<ApplicationResponseDto> {
    try {
      // Fetch the application entity
      const applicationEntity = await this.applicationsRepository.findById(id);
      if (!applicationEntity) {
        throw new EntityNotFoundException('Application', id);
      }

      // Validate rejection reason is provided when status is REJECTED
      if (newStatus === ApplicationStatus.REJECTED && !rejectionReason) {
        throw new InvalidDataException('Rejection reason is required when status is REJECTED');
      }

      // Prepare the status update DTO
      const statusUpdateDto: UpdateApplicationDto = {
        applicationStatus: newStatus,
      };

      // Add rejection reason if provided
      if (rejectionReason) {
        (statusUpdateDto as any).rejectionReason = rejectionReason;
      }

      // If status is changing to APPROVED or REJECTED, handle reviewDate
      if (
        newStatus === ApplicationStatus.APPROVED ||
        newStatus === ApplicationStatus.REJECTED
      ) {
        // The repository will handle setting reviewedAt timestamp
      }

      // Perform the update using the repository
      const updatedApplication = await this.applicationsRepository.update(
        applicationEntity.id,
        statusUpdateDto,
      );

      // Map the updated entity back to DTO
      return this.mapToResponseDto(updatedApplication);
    } catch (error) {
      if (error instanceof EntityNotFoundException || error instanceof InvalidDataException) {
        throw error;
      }
      throw new InvalidDataException(
        'Failed to update application status',
        error.message,
      );
    }
  }

  async remove(id: string, userId: string, role: Role): Promise<void> {
    try {
      // Fetch the entity first
      const applicationEntity = await this.applicationsRepository.findById(id);
      if (!applicationEntity) {
        throw new EntityNotFoundException('Application', id);
      }

      // Get the user's profile
      const profile = await this.profilesService.findByUserId(userId);
      if (!profile) {
        throw new EntityNotFoundException('Profile', userId);
      }

      // Check if this application belongs to the user's profile
      if (applicationEntity.profileId !== profile.id) {
        throw new ForbiddenActionException(
          'You do not have permission to delete this application',
        );
      }

      // Only allow deletion of applications in DRAFT state
      if (String(applicationEntity.applicationStatus) !== 'DRAFT') {
        throw new ForbiddenActionException(
          'Only draft applications can be deleted',
        );
      }

      // Allow ADMIN to delete any application
      // Allow CLIENT to delete only their own DRAFT applications
      if (role === Role.CLIENT) {
        if (applicationEntity.profileId !== profile.id) {
          throw new ForbiddenActionException(
            'You do not have permission to delete this application',
          );
        }
        if (applicationEntity.applicationStatus !== ApplicationStatus.DRAFT) {
          throw new ForbiddenActionException(
            'Only DRAFT applications can be deleted by the client',
          );
        }
      }

      // Use the entity's ID for removal
      await this.applicationsRepository.remove(applicationEntity.id);
    } catch (error) {
      if (
        error instanceof EntityNotFoundException ||
        error instanceof ForbiddenActionException
      ) {
        throw error;
      }
      throw new InvalidDataException(
        'Failed to delete application',
        error.message,
      );
    }
  }

  async submit(id: string, userId: string) {
    try {
      // Fetch the entity first
      const applicationEntity = await this.applicationsRepository.findById(id);
      if (!applicationEntity) {
        throw new EntityNotFoundException('Application', id);
      }

      // Check ownership
      const profile = await this.profilesService.findByUserId(userId);
      if (!profile || applicationEntity.profileId !== profile.id) {
        throw new ForbiddenActionException(
          'You cannot submit this application.',
        );
      }

      // Check current status
      if (applicationEntity.applicationStatus !== ApplicationStatus.DRAFT) {
        throw new InvalidDataException(
          'Application has already been submitted or processed.',
        );
      }

      // Prepare an UpdateApplicationDto for submission
      const submitUpdateDto: UpdateApplicationDto = {
        applicationStatus: ApplicationStatus.SUBMITTED,
        // Pass date as string, repository handles conversion
        submittedAt: new Date().toISOString(),
      };

      // Persist changes using repository update method with DTO
      const updatedApplication = await this.applicationsRepository.update(
        applicationEntity.id,
        submitUpdateDto,
      );

      // Map the updated entity to the response DTO
      return this.mapToResponseDto(updatedApplication);
    } catch (error) {
      if (
        error instanceof EntityNotFoundException ||
        error instanceof ForbiddenActionException ||
        error instanceof InvalidDataException
      ) {
        throw error;
      }
      throw new InvalidDataException(
        'Failed to submit application',
        error.message,
      );
    }
  }

  // Use Prisma's Application type, relax Profile type slightly for mapping
  private mapToResponseDto(
    application: Application & {
      profile?: any;
      university?: any;
      program?: any;
    },
  ): ApplicationResponseDto {
    return {
      id: application.id,
      profileId: application.profileId,
      profile: application.profile,
      // University preferences
      preferredCountry: application.preferredCountry,

      // University information
      preferredUniversityId:
        application.university?.id || application.preferredUniversity,
      preferredUniversityName:
        application.university?.name || 'Unknown University',
      preferredCountryId:
        application.university?.country?.code ||
        application.university?.countryCode ||
        0,
      preferredCountryName:
        application.university?.country?.nameEn || 'Unknown Country',

      // Program information
      preferredProgrammId:
        application.program?.id || application.preferredProgram,
      preferredProgrammName:
        application.program?.titleEn ||
        application.program?.titleRu ||
        'Unknown Program',

      intakeSeason: application.intakeSeason,
      intakeYear: application.intakeYear,

      // Status fields
      applicationStatus: application.applicationStatus,
      rejectionReason: application.rejectionReason,
      submittedAt: application.submittedAt,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,

      // Optional fields from ApplicationResponseDto
      programType: (application as any).programType,
      academicYear: (application as any).academicYear,
      notes: (application as any).notes,
      adminNotes: (application as any).adminNotes,
      assignedTo: (application as any).assignedTo,
      reviewDate: (application as any).reviewDate,
    };
  }
}
