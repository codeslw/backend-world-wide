import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { Prisma, ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationsRepository {
  constructor(private prisma: PrismaService) {}

  async create(profileId: string, createApplicationDto: CreateApplicationDto) {
    // Only handle submittedAt date conversion, other date fields are now in Profile
    const { submittedAt, preferredUniversity, preferredProgram, ...restData } = createApplicationDto;

    return this.prisma.application.create({
      data: {
        ...restData,
        profile: { connect: { id: profileId } },
        university : {connect : {id: preferredUniversity}},
        program  : {connect : {id: preferredProgram}},
        ...(submittedAt && { submittedAt: new Date(submittedAt) }),
      },
      include: {
        profile: true,
        university : true,
        program : true
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
        profile: true,
        program : true,
        university : true
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
    // Only handle submittedAt date conversion, other date fields are now in Profile
    const { submittedAt, ...restData } = updateApplicationDto;

    // Build the update data
    const data = {
      ...restData,
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
