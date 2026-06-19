import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreatePartnerApplicationDto } from './dto/create-partner-application.dto';
import { UpdatePartnerApplicationDto } from './dto/update-partner-application.dto';
import { UpdatePartnerApplicationStatusDto } from './dto/update-partner-application-status.dto';
import { PartnerApplicationResponseDto } from './dto/partner-application-response.dto';
import { PartnerApplicationStatus } from '@prisma/client';
import {
  EntityNotFoundException,
  ForbiddenActionException,
  InvalidDataException,
} from '../common/exceptions/app.exceptions';
import { PartnerOrganizationsService } from '../partner-organizations/partner-organizations.service';

@Injectable()
export class PartnerApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly partnerOrgs: PartnerOrganizationsService,
  ) {}

  private readonly includeRelations = {
    partnerStudent: true,
    university: {
      include: { country: true },
    },
    program: true,
    partner: {
      select: {
        id: true,
        email: true,
        partnerOrganization: { select: { id: true, name: true } },
        partnerMembership: {
          select: { organization: { select: { id: true, name: true } } },
        },
      },
    },
  };

  async create(
    partnerId: string,
    dto: CreatePartnerApplicationDto,
  ): Promise<PartnerApplicationResponseDto> {
    // Verify the partner student belongs to this partner
    const student = await this.prisma.partnerStudent.findUnique({
      where: { id: dto.partnerStudentId },
    });

    if (!student) {
      throw new EntityNotFoundException('PartnerStudent', dto.partnerStudentId);
    }

    if (student.partnerId !== partnerId) {
      throw new ForbiddenActionException(
        'This student does not belong to your account',
      );
    }

    // Verify university-program relationship exists. The partner UI submits the
    // university_programs.id, but accepting the raw Program id keeps older clients working.
    const universityProgram = await this.prisma.universityProgram.findFirst({
      where: {
        universityId: dto.universityId,
        OR: [{ id: dto.programId }, { programId: dto.programId }],
      },
      include: {
        university: true,
        program: true,
      },
    });

    if (!universityProgram) {
      throw new EntityNotFoundException(
        'Program',
        `University program with relationship ID ${dto.programId} not found for university ${dto.universityId}`,
      );
    }

    const { university, program } = universityProgram;

    const existingApplication = await this.prisma.partnerApplication.findFirst({
      where: {
        partnerId,
        partnerStudentId: dto.partnerStudentId,
        universityId: dto.universityId,
        programId: program.id,
        intakeSeason: dto.intakeSeason,
        intakeYear: dto.intakeYear,
        status: {
          notIn: [
            PartnerApplicationStatus.REJECTED,
            PartnerApplicationStatus.WITHDRAWN,
          ],
        },
      },
      select: { id: true },
    });

    if (existingApplication) {
      throw new InvalidDataException(
        'An active application already exists for this student, program, and intake',
      );
    }

    const application = await this.prisma.partnerApplication.create({
      data: {
        partner: { connect: { id: partnerId } },
        partnerStudent: { connect: { id: dto.partnerStudentId } },
        university: { connect: { id: dto.universityId } },
        program: { connect: { id: program.id } },
        intakeSeason: dto.intakeSeason,
        intakeYear: dto.intakeYear,
        englishProficiency: dto.englishProficiency,
        gpa: dto.gpa,
        prerequisites: dto.prerequisites,
        notes: dto.notes,
        backupPrograms: dto.backupPrograms
          ? JSON.stringify(dto.backupPrograms)
          : '[]',
        status: PartnerApplicationStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: this.includeRelations,
    });

    return this.mapToDto(application);
  }

  async findAllByPartner(
    userId: string,
    options?: { skip?: number; take?: number; studentId?: string },
  ) {
    const { skip = 0, take = 50, studentId } = options || {};

    // Org-wide visibility, gated by VIEW_STUDENTS for plain members.
    const visiblePartnerIds =
      await this.partnerOrgs.resolveVisiblePartnerIds(userId);

    const where = {
      partnerId: { in: visiblePartnerIds },
      ...(studentId ? { partnerStudentId: studentId } : {}),
    };

    const [applications, total] = await Promise.all([
      this.prisma.partnerApplication.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: this.includeRelations,
      }),
      this.prisma.partnerApplication.count({ where }),
    ]);

    return {
      data: applications.map((a) => this.mapToDto(a)),
      meta: {
        total,
        page: Math.floor(skip / take) + 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    status?: PartnerApplicationStatus;
    search?: string;
  }) {
    const { skip = 0, take = 50, status, search } = options || {};

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        {
          partnerStudent: {
            firstName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          partnerStudent: {
            lastName: { contains: search, mode: 'insensitive' },
          },
        },
        { university: { name: { contains: search, mode: 'insensitive' } } },
        { program: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [applications, total] = await Promise.all([
      this.prisma.partnerApplication.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: this.includeRelations,
      }),
      this.prisma.partnerApplication.count({ where }),
    ]);

    return {
      data: applications.map((a) => this.mapToDto(a)),
      meta: {
        total,
        page: Math.floor(skip / take) + 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(
    id: string,
    partnerIds?: string[],
  ): Promise<PartnerApplicationResponseDto> {
    const application = await this.prisma.partnerApplication.findUnique({
      where: { id },
      include: this.includeRelations,
    });

    if (!application) {
      throw new EntityNotFoundException('PartnerApplication', id);
    }

    if (partnerIds && !partnerIds.includes(application.partnerId)) {
      throw new ForbiddenActionException(
        'You do not have permission to access this application',
      );
    }

    return this.mapToDto(application);
  }

  async update(
    id: string,
    partnerIds: string[],
    dto: UpdatePartnerApplicationDto,
  ): Promise<PartnerApplicationResponseDto> {
    const application = await this.prisma.partnerApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new EntityNotFoundException('PartnerApplication', id);
    }

    if (!partnerIds.includes(application.partnerId)) {
      throw new ForbiddenActionException(
        'You do not have permission to update this application',
      );
    }

    // Only allow updates in DRAFT status
    if (application.status !== PartnerApplicationStatus.DRAFT) {
      throw new ForbiddenActionException(
        'Application can only be updated while in DRAFT status',
      );
    }

    return this.applyUpdate(id, dto);
  }

  /**
   * Admin edit of a partner-submitted application. Unlike the partner update,
   * this is not restricted to DRAFT status or to a partner owner.
   */
  async adminUpdate(
    id: string,
    dto: UpdatePartnerApplicationDto,
  ): Promise<PartnerApplicationResponseDto> {
    const application = await this.prisma.partnerApplication.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!application) {
      throw new EntityNotFoundException('PartnerApplication', id);
    }

    return this.applyUpdate(id, dto);
  }

  private async applyUpdate(
    id: string,
    dto: UpdatePartnerApplicationDto,
  ): Promise<PartnerApplicationResponseDto> {
    const updated = await this.prisma.partnerApplication.update({
      where: { id },
      data: {
        ...(dto.intakeSeason && { intakeSeason: dto.intakeSeason }),
        ...(dto.intakeYear && { intakeYear: dto.intakeYear }),
        ...(dto.englishProficiency !== undefined && {
          englishProficiency: dto.englishProficiency,
        }),
        ...(dto.gpa !== undefined && { gpa: dto.gpa }),
        ...(dto.prerequisites !== undefined && {
          prerequisites: dto.prerequisites,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.backupPrograms && {
          backupPrograms: JSON.stringify(dto.backupPrograms),
        }),
      },
      include: this.includeRelations,
    });

    return this.mapToDto(updated);
  }

  async updateStatus(
    id: string,
    dto: UpdatePartnerApplicationStatusDto,
  ): Promise<PartnerApplicationResponseDto> {
    const application = await this.prisma.partnerApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new EntityNotFoundException('PartnerApplication', id);
    }

    if (dto.status === PartnerApplicationStatus.REJECTED && !dto.reason) {
      throw new InvalidDataException(
        'Rejection reason is required when status is REJECTED',
      );
    }

    const data: any = {
      status: dto.status,
    };

    if (dto.reason) data.rejectionReason = dto.reason;
    if (dto.adminNotes) data.adminNotes = dto.adminNotes;

    // Set reviewedAt for terminal statuses
    if (
      dto.status === PartnerApplicationStatus.ACCEPTED ||
      dto.status === PartnerApplicationStatus.REJECTED ||
      dto.status === PartnerApplicationStatus.CONDITIONAL_OFFER
    ) {
      data.reviewedAt = new Date();
    }

    const updated = await this.prisma.partnerApplication.update({
      where: { id },
      data,
      include: this.includeRelations,
    });

    return this.mapToDto(updated);
  }

  async remove(id: string, partnerIds?: string[]): Promise<void> {
    const application = await this.prisma.partnerApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new EntityNotFoundException('PartnerApplication', id);
    }

    if (partnerIds && !partnerIds.includes(application.partnerId)) {
      throw new ForbiddenActionException(
        'You do not have permission to delete this application',
      );
    }

    if (
      application.status !== PartnerApplicationStatus.DRAFT &&
      application.status !== PartnerApplicationStatus.WITHDRAWN
    ) {
      throw new ForbiddenActionException(
        'Only DRAFT or WITHDRAWN applications can be deleted',
      );
    }

    await this.prisma.partnerApplication.delete({ where: { id } });
  }

  private mapToDto(application: any): PartnerApplicationResponseDto {
    const org =
      application.partner?.partnerOrganization ||
      application.partner?.partnerMembership?.organization ||
      null;
    return {
      id: application.id,
      partnerId: application.partnerId,
      partnerOrganizationId: org?.id ?? null,
      partnerOrganizationName: org?.name ?? null,
      partnerStudentId: application.partnerStudentId,
      partnerStudent: application.partnerStudent,
      universityId: application.universityId,
      universityName: application.university?.name,
      countryName: application.university?.country?.nameEn,
      studentName: application.partnerStudent
        ? `${application.partnerStudent.firstName} ${application.partnerStudent.lastName}`.trim()
        : undefined,
      studentEmail: application.partnerStudent?.email,
      universityLogoUrl: (application.university as any)?.logo || undefined,
      programId: application.programId,
      programName: application.program?.title || 'Unknown Program',
      intakeSeason: application.intakeSeason,
      intakeYear: application.intakeYear,
      status: application.status,
      rejectionReason: application.rejectionReason,
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      englishProficiency: application.englishProficiency,
      gpa: application.gpa,
      prerequisites: application.prerequisites,
      notes: application.notes,
      adminNotes: application.adminNotes,
      assignedTo: application.assignedTo,
      backupPrograms:
        typeof application.backupPrograms === 'string'
          ? JSON.parse(application.backupPrograms)
          : application.backupPrograms || [],
      documents:
        typeof application.documents === 'string'
          ? JSON.parse(application.documents)
          : application.documents || [],
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  }
}
