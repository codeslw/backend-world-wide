import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationStatus, Gender } from './enums/application.enum';
import { Prisma } from '@prisma/client';

@Injectable()
export class ApplicationsRepository {
  constructor(private prisma: PrismaService) {}

  async create(profileId: string, createApplicationDto: CreateApplicationDto) {
    // Convert date strings to Date objects
    const { dateOfBirth, passportExpiryDate, submittedAt, ...restData } = createApplicationDto;
    
    return this.prisma.application.create({
      data: {
        ...restData,
        profile: { connect: { id: profileId } },
        dateOfBirth: new Date(dateOfBirth),
        passportExpiryDate: new Date(passportExpiryDate),
        ...(submittedAt && { submittedAt: new Date(submittedAt) }),
      },
      include: {
        profile: true,
      },
    });
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: any;
    includeProfile?: boolean;
  }) {
    const {
      skip,
      take,
      orderBy,
      where,
      includeProfile = false,
    } = options || {};

    return this.prisma.application.findMany({
      skip,
      take,
      orderBy,
      where,
      include: {
        profile: includeProfile,
      },
    });
  }

  async count(where?: any) {
    return this.prisma.application.count({ where });
  }

  async findById(id: string, includeProfile = false) {
    return this.prisma.application.findUnique({
      where: { id },
      include: {
        profile: includeProfile,
      },
    });
  }

  async findByProfileId(profileId: string) {
    return this.prisma.application.findMany({
      where: { profileId },
      include: {
        profile: true,
      },
    });
  }

  async update(id: string, updateApplicationDto: UpdateApplicationDto) {
    // Process date fields
    const { dateOfBirth, passportExpiryDate, submittedAt, ...restData } = updateApplicationDto;
    
    // Build the update data
    const data = {
      ...restData,
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      ...(passportExpiryDate && { passportExpiryDate: new Date(passportExpiryDate) }),
      ...(submittedAt && { submittedAt: new Date(submittedAt) }),
    };

    // If status is being changed to SUBMITTED, set submittedAt if not provided
    if (
      data.applicationStatus === ApplicationStatus.SUBMITTED &&
      !data.submittedAt
    ) {
      data.submittedAt = new Date();
    }

    return this.prisma.application.update({
      where: { id },
      data,
      include: {
        profile: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.application.delete({
      where: { id },
    });
  }
}
