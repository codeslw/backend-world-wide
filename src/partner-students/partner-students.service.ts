import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreatePartnerStudentDto } from './dto/create-partner-student.dto';
import { UpdatePartnerStudentDto } from './dto/update-partner-student.dto';
import { PartnerApplicationStatus } from '@prisma/client';

const STAGE_BY_STATUS: Record<PartnerApplicationStatus, string> = {
  DRAFT: 'Ready to Apply',
  SUBMITTED: 'Offer Issued',
  UNDER_REVIEW: 'Offer Issued',
  DOCUMENTS_REQUIRED: 'Ready for Visa',
  CONDITIONAL_OFFER: 'Ready for Enrollment',
  ACCEPTED: 'Ready for Enrollment',
  REJECTED: 'Created',
  WITHDRAWN: 'Created',
  ENROLLED: 'Done',
};

const STAGE_RANK: Record<string, number> = {
  Created: 0,
  'Ready to Apply': 1,
  'Offer Issued': 2,
  'Ready for Visa': 3,
  'Ready for Enrollment': 4,
  Done: 5,
};

function deriveCurrentStage(partnerApplications?: Array<{ status: PartnerApplicationStatus; createdAt?: Date }>) {
  if (!partnerApplications || partnerApplications.length === 0) {
    return 'Created';
  }

  const derivedStages = partnerApplications.map((app) => STAGE_BY_STATUS[app.status] ?? 'Ready to Apply');
  return derivedStages.reduce((best, stage) => {
    return STAGE_RANK[stage] > STAGE_RANK[best] ? stage : best;
  }, 'Created');
}

@Injectable()
export class PartnerStudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(partnerId: string, createStudentDto: CreatePartnerStudentDto) {
    const { dateOfBirth, passportExpiryDate, ...rest } = createStudentDto;

    const data: any = { partnerId };
    if (dateOfBirth) data.dateOfBirth = new Date(dateOfBirth);
    if (passportExpiryDate) data.passportExpiryDate = new Date(passportExpiryDate);

    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) data[k] = v;
    }

    return this.prisma.partnerStudent.create({ data });
  }

  async findAllByPartner(partnerId: string) {
    const students = await this.prisma.partnerStudent.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { partnerApplications: true, studentDocuments: true } },
        partnerApplications: {
          select: { id: true, status: true, createdAt: true, updatedAt: true },
          orderBy: { createdAt: 'desc' },
        },
        partner: {
          select: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return students.map((student) => ({
      ...student,
      currentStage: deriveCurrentStage(student.partnerApplications as any),
    }));
  }

  async findAll() {
    return this.prisma.partnerStudent.findMany({
      include: {
        partner: {
          select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, partnerId?: string) {
    const student = partnerId
      ? await this.prisma.partnerStudent.findFirst({
          where: { id, partnerId },
          include: {
            _count: { select: { partnerApplications: true, studentDocuments: true } },
            partnerApplications: {
              include: {
                university: { select: { id: true, name: true } },
                program: { select: { id: true, titleEn: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        })
      : await this.prisma.partnerStudent.findUnique({
          where: { id },
          include: {
            _count: { select: { partnerApplications: true, studentDocuments: true } },
            partnerApplications: {
              include: {
                university: { select: { id: true, name: true } },
                program: { select: { id: true, titleEn: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        });
    if (!student) {
      throw new NotFoundException(`Student not found`);
    }
    return {
      ...student,
      currentStage: deriveCurrentStage(student.partnerApplications as any),
    };
  }

  async update(id: string, updateStudentDto: UpdatePartnerStudentDto, partnerId?: string) {
    await this.findOne(id, partnerId); // Ensure exists and belongs to partner

    const { dateOfBirth, passportExpiryDate, ...rest } = updateStudentDto;

    // Remove undefined values to avoid Prisma relation errors
    const dataToUpdate: any = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined),
    );
    if (dateOfBirth) dataToUpdate.dateOfBirth = new Date(dateOfBirth);
    if (passportExpiryDate) dataToUpdate.passportExpiryDate = new Date(passportExpiryDate);

    return this.prisma.partnerStudent.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string, partnerId?: string) {
    await this.findOne(id, partnerId);
    return this.prisma.partnerStudent.delete({
      where: { id },
    });
  }
}
