import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApplicationsRepository } from './applications.repository';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { ApplicationStatus } from './enums/application.enum';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applicationsRepository: ApplicationsRepository,
    private readonly profilesService: ProfilesService,
  ) {}

  async create(userId: string, createApplicationDto: CreateApplicationDto) {
    // Get the profile for the user
    const profile = await this.profilesService.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.applicationsRepository.create(profile.id, createApplicationDto);
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: any;
    includeProfile?: boolean;
  }) {
    return this.applicationsRepository.findAll(options);
  }

  async findAllByUserId(userId: string) {
    // Get the profile for the user
    const profile = await this.profilesService.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.applicationsRepository.findByProfileId(profile.id);
  }

  async count(where?: any) {
    return this.applicationsRepository.count(where);
  }

  async findOne(id: string, includeProfile = true) {
    const application = await this.applicationsRepository.findById(
      id,
      includeProfile,
    );
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return application;
  }

  async update(
    id: string,
    userId: string,
    updateApplicationDto: UpdateApplicationDto,
  ) {
    // Verify the application exists
    const application = await this.findOne(id);

    // Get the user's profile
    const profile = await this.profilesService.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Check if this application belongs to the user's profile
    if (application.profileId !== profile.id) {
      throw new ForbiddenException(
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
  }

  async remove(id: string, userId: string) {
    // Verify the application exists
    const application = await this.findOne(id);

    // Get the user's profile
    const profile = await this.profilesService.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Check if this application belongs to the user's profile
    if (application.profileId !== profile.id) {
      throw new ForbiddenException(
        'You do not have permission to delete this application',
      );
    }

    // Only allow deletion of applications in DRAFT state
    if (String(application.applicationStatus) !== 'DRAFT') {
      throw new ForbiddenException('Only draft applications can be deleted');
    }

    return this.applicationsRepository.remove(id);
  }

  async submit(id: string, userId: string) {
    // Verify the application exists
    const application = await this.findOne(id);

    // Get the user's profile
    const profile = await this.profilesService.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Check if this application belongs to the user's profile
    if (application.profileId !== profile.id) {
      throw new ForbiddenException(
        'You do not have permission to submit this application',
      );
    }

    // Only allow submission of applications in DRAFT state
    if (String(application.applicationStatus) !== 'DRAFT') {
      throw new ForbiddenException('Only draft applications can be submitted');
    }

    return this.applicationsRepository.update(id, {
      applicationStatus: ApplicationStatus.SUBMITTED,
      submittedAt: new Date().toISOString(),
    });
  }
}
