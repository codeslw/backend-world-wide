import { Injectable } from '@nestjs/common';
import { ProfilesRepository } from './profiles.repository';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import {
  FilterOptions,
  PaginationOptions,
} from '../common/filters/filter.interface';
import { PrismaService } from '../db/prisma.service';
import { EntityNotFoundException } from '../common/exceptions/app.exceptions';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { Prisma, Profile } from '@prisma/client';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly profilesRepository: ProfilesRepository,
    private readonly filterService: FilterService,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    createProfileDto: CreateProfileDto,
  ): Promise<ProfileResponseDto> {
    const {
      educationHistory,
      languageCertificates,
      standardizedTests,
      ...profileData
    } = createProfileDto;

    const data: Prisma.ProfileCreateInput = {
      ...profileData,
      user: { connect: { id: userId } },
      educationHistory: educationHistory
        ? { create: educationHistory }
        : undefined,
      languageCertificates: languageCertificates
        ? { create: languageCertificates }
        : undefined,
      standardizedTests: standardizedTests
        ? { create: standardizedTests }
        : undefined,
    };

    const createdProfile = await this.profilesRepository.create(data);
    return this.findOne(createdProfile.id);
  }

  async findAll(paginationDto?: PaginationDto) {
    const filterOptions: FilterOptions = {
      filters: [
        {
          field: 'createdAt',
          queryParam: 'createdAfter',
          operator: 'gte',
          transform: (value) => new Date(value),
        },
        {
          field: 'createdAt',
          queryParam: 'createdBefore',
          operator: 'lte',
          transform: (value) => new Date(value),
        },
      ],
      searchFields: ['firstName', 'lastName', 'email', 'phoneNumber'],
    };

    const where = this.filterService.buildFilterQuery(
      paginationDto || {},
      filterOptions,
    );

    const paginationOptions: PaginationOptions = {
      defaultLimit: 10,
      maxLimit: 300,
      defaultSortField: 'createdAt',
      defaultSortDirection: 'desc',
    };

    const result = await this.filterService.applyPagination(
      this.prisma.profile,
      where,
      paginationDto,
      {
        educationHistory: true,
        languageCertificates: true,
        standardizedTests: true,
      },
      undefined,
      paginationOptions,
    );

    return {
      ...result,
      data: result.data.map(this.mapToResponseDto),
    };
  }

  async findOne(id: string): Promise<ProfileResponseDto> {
    const profile = await this.profilesRepository.findById(id, {
      educationHistory: true,
      languageCertificates: true,
      standardizedTests: true,
    });
    if (!profile) {
      throw new EntityNotFoundException('Profile', id);
    }
    return this.mapToResponseDto(profile as any);
  }

  async findByUserId(userId: string): Promise<ProfileResponseDto> {
    const profile = await this.profilesRepository.findByUserId(userId, {
      educationHistory: true,
      languageCertificates: true,
      standardizedTests: true,
    });
    if (!profile) {
      throw new EntityNotFoundException('Profile', `for user ID: ${userId}`);
    }
    return this.mapToResponseDto(profile as any);
  }

  async update(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const {
      educationHistory,
      languageCertificates,
      standardizedTests,
      ...profileData
    } = updateProfileDto;

    if ('hasRequirements' in profileData) {
      delete (profileData as any).hasRequirements;
    }

    await this.findOne(id); // Check if profile exists

    const updatedProfile = await this.prisma.$transaction(async (tx) => {
      if (educationHistory) {
        await tx.education.deleteMany({ where: { profileId: id } });
        await tx.education.createMany({
          data: educationHistory.map((edu) => ({ ...edu, profileId: id })),
        });
      }

      if (languageCertificates) {
        await tx.languageCertificate.deleteMany({ where: { profileId: id } });
        await tx.languageCertificate.createMany({
          data: languageCertificates.map((cert) => ({
            ...cert,
            profileId: id,
          })),
        });
      }

      if (standardizedTests) {
        await tx.standardizedTest.deleteMany({ where: { profileId: id } });
        await tx.standardizedTest.createMany({
          data: standardizedTests.map((test) => ({ ...test, profileId: id })),
        });
      }

      return tx.profile.update({
        where: { id },
        data: profileData,
        include: {
          educationHistory: true,
          languageCertificates: true,
          standardizedTests: true,
        },
      });
    });

    return this.mapToResponseDto(updatedProfile as any);
  }

  async remove(id: string): Promise<ProfileResponseDto> {
    await this.findOne(id); // Check if profile exists
    const deletedProfile = await this.profilesRepository.remove(id);
    return this.mapToResponseDto(deletedProfile as any);
  }

  mapToResponseDto(
    profile: Profile & {
      educationHistory?: any[];
      languageCertificates?: any[];
      standardizedTests?: any[];
    },
  ): ProfileResponseDto {
    return {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: profile.middleName || undefined,
      dateOfBirth: profile.dateOfBirth || undefined,
      gender: profile.gender || undefined,
      nationality: profile.nationality || undefined,
      address: profile.address || undefined,
      passportExpiryDate: profile.passportExpiryDate || undefined,
      passportCopyUrl: profile.passportCopyUrl || undefined,
      motivationLetterUrl: profile.motivationLetterUrl || undefined,
      recommendationLetterUrls: profile.recommendationLetterUrls || undefined,
      cvUrl: profile.cvUrl || undefined,
      yearOfBirth: profile.yearOfBirth || undefined,
      passportSeriesAndNumber: profile.passportSeriesAndNumber || undefined,
      email: profile.email || undefined,
      phoneNumber: profile.phoneNumber || undefined,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      educationHistory: profile.educationHistory || [],
      languageCertificates: profile.languageCertificates || [],
      standardizedTests: profile.standardizedTests || [],
    };
  }
}
