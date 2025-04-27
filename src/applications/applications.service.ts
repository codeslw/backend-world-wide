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

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applicationsRepository: ApplicationsRepository,
    private readonly profilesService: ProfilesService,
  ) {}

  async create(userId: string, createApplicationDto: CreateApplicationDto) {
    try {
      // Get the profile for the user
      const profile = await this.profilesService.findByUserId(userId);
      if (!profile) {
        throw new EntityNotFoundException('Profile', userId);
      }

      return this.applicationsRepository.create(profile.id, createApplicationDto);
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
  }) {
    try {
      return this.applicationsRepository.findAll(options);
    } catch (error) {
      throw new InvalidDataException('Failed to retrieve applications', error.message);
    }
  }

  async findAllByUserId(userId: string) {
    try {
      // Get the profile for the user
      const profile = await this.profilesService.findByUserId(userId);
      if (!profile) {
        throw new EntityNotFoundException('Profile', userId);
      }

      return this.applicationsRepository.findByProfileId(profile.id);
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      throw new InvalidDataException('Failed to retrieve user applications', error.message);
    }
  }

  async count(where?: any) {
    try {
      return this.applicationsRepository.count(where);
    } catch (error) {
      throw new InvalidDataException('Failed to count applications', error.message);
    }
  }

  async findOne(id: string, includeProfile = true) {
    try {
      const application = await this.applicationsRepository.findById(
        id,
        includeProfile,
      );
      if (!application) {
        throw new EntityNotFoundException('Application', id);
      }
      return application;
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
  ) {
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

      // If transitioning from DRAFT to SUBMITTED, set the submittedAt timestamp
      if (
        String(application.applicationStatus) === 'DRAFT' &&
        String(updateApplicationDto.applicationStatus) === 'SUBMITTED'
      ) {
        updateApplicationDto.submittedAt = new Date().toISOString();
      }

      return this.applicationsRepository.update(id, updateApplicationDto);
    } catch (error) {
      if (error instanceof EntityNotFoundException || 
          error instanceof ForbiddenActionException) {
        throw error;
      }
      throw new InvalidDataException('Failed to update application', error.message);
    }
  }

  async remove(id: string, userId: string) {
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

      return this.applicationsRepository.remove(id);
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
}
