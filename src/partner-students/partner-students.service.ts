import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreatePartnerStudentDto } from './dto/create-partner-student.dto';
import { UpdatePartnerStudentDto } from './dto/update-partner-student.dto';
import { PartnerApplicationStatus } from '@prisma/client';
import { PartnerOrganizationsService } from '../partner-organizations/partner-organizations.service';
import { normalizeStage } from '../crm-events/process-stage';

/**
 * The student's place in the portal's pipeline, from the admission stage of the
 * application that got furthest. Closed applications don't move a student on.
 * The labels are the portal's; the stages are the ones edu-crm works with
 * (src/crm-events/process-stage.ts).
 */
const PIPELINE = [
  'Created',
  'Ready to Apply',
  'Offer Issued',
  'Ready for Visa',
  'Ready for Enrollment',
  'Done',
];

export function pipelineLabel(application: {
  status: PartnerApplicationStatus;
  stage?: number | null;
  visaStatus?: string | null;
}): string {
  if (application.status === 'REJECTED' || application.status === 'WITHDRAWN') {
    return 'Created';
  }
  const stage = normalizeStage(application.status, application.stage);
  if (stage >= 7) return 'Done';
  if (stage === 6) {
    return application.visaStatus === 'APPROVED'
      ? 'Ready for Enrollment'
      : 'Ready for Visa';
  }
  return stage === 5 ? 'Offer Issued' : 'Ready to Apply';
}

export function deriveCurrentStage(
  partnerApplications?: Array<{
    status: PartnerApplicationStatus;
    stage?: number | null;
    visaStatus?: string | null;
  }>,
) {
  return (partnerApplications ?? [])
    .map(pipelineLabel)
    .reduce(
      (best, label) =>
        PIPELINE.indexOf(label) > PIPELINE.indexOf(best) ? label : best,
      'Created',
    );
}

@Injectable()
export class PartnerStudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly partnerOrgs: PartnerOrganizationsService,
  ) {}

  async create(partnerId: string, createStudentDto: CreatePartnerStudentDto) {
    const { dateOfBirth, passportExpiryDate, ...rest } = createStudentDto;

    const data: any = { partnerId };
    if (dateOfBirth) data.dateOfBirth = new Date(dateOfBirth);
    if (passportExpiryDate)
      data.passportExpiryDate = new Date(passportExpiryDate);

    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) data[k] = v;
    }

    return this.prisma.partnerStudent.create({ data });
  }

  async findAllByPartner(userId: string) {
    // Org-wide visibility: a partner sees every student created by anyone in
    // their agency that they are permitted to see (owners/managers see all;
    // a plain member needs VIEW_STUDENTS, otherwise only their own).
    const visiblePartnerIds =
      await this.partnerOrgs.resolveVisiblePartnerIds(userId);

    const students = await this.prisma.partnerStudent.findMany({
      where: { partnerId: { in: visiblePartnerIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { partnerApplications: true, studentDocuments: true },
        },
        partnerApplications: {
          select: {
            id: true,
            status: true,
            stage: true,
            visaStatus: true,
            createdAt: true,
            updatedAt: true,
          },
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
      currentStage: deriveCurrentStage(student.partnerApplications),
    }));
  }

  async findAll(search?: string, partnerIds?: string[]) {
    const term = search?.trim();
    const filters: any[] = [];
    if (partnerIds) filters.push({ partnerId: { in: partnerIds } });
    const searchWhere: any = term
      ? {
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { middleName: { contains: term, mode: 'insensitive' } },
            { countryOfCitizenship: { contains: term, mode: 'insensitive' } },
            // Partner member (creator) name and email
            {
              partner: {
                profile: {
                  OR: [
                    { firstName: { contains: term, mode: 'insensitive' } },
                    { lastName: { contains: term, mode: 'insensitive' } },
                  ],
                },
              },
            },
            { partner: { email: { contains: term, mode: 'insensitive' } } },
            // Partner organization name — direct relation or via membership
            {
              partner: {
                partnerOrganization: {
                  name: { contains: term, mode: 'insensitive' },
                },
              },
            },
            {
              partner: {
                partnerMembership: {
                  organization: {
                    name: { contains: term, mode: 'insensitive' },
                  },
                },
              },
            },
          ],
        }
      : null;
    if (searchWhere) filters.push(searchWhere);
    const where: any = filters.length ? { AND: filters } : {};

    const students = await this.prisma.partnerStudent.findMany({
      where,
      include: {
        _count: {
          select: { partnerApplications: true, studentDocuments: true },
        },
        partnerApplications: {
          select: {
            id: true,
            status: true,
            stage: true,
            visaStatus: true,
            origin: true,
            createdAt: true,
            university: { select: { name: true } },
            program: { select: { title: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        partner: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
            partnerOrganization: { select: { id: true, name: true } },
            partnerMembership: {
              select: {
                organization: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return students.map((student) => {
      const org =
        (student.partner as any)?.partnerOrganization ||
        (student.partner as any)?.partnerMembership?.organization ||
        null;
      return {
        ...student,
        currentStage: deriveCurrentStage(student.partnerApplications),
        partnerOrganizationId: org?.id ?? null,
        partnerOrganizationName: org?.name ?? null,
      };
    });
  }

  async findOne(id: string, partnerIds?: string[]) {
    const student = partnerIds
      ? await this.prisma.partnerStudent.findFirst({
          where: { id, partnerId: { in: partnerIds } },
          include: {
            _count: {
              select: { partnerApplications: true, studentDocuments: true },
            },
            partnerApplications: {
              include: {
                university: { select: { id: true, name: true } },
                program: { select: { id: true, title: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        })
      : await this.prisma.partnerStudent.findUnique({
          where: { id },
          include: {
            _count: {
              select: { partnerApplications: true, studentDocuments: true },
            },
            partnerApplications: {
              include: {
                university: { select: { id: true, name: true } },
                program: { select: { id: true, title: true } },
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
      currentStage: deriveCurrentStage(student.partnerApplications),
    };
  }

  async update(
    id: string,
    updateStudentDto: UpdatePartnerStudentDto,
    partnerIds?: string[],
  ) {
    await this.findOne(id, partnerIds); // Ensure exists and is visible to partner

    const { dateOfBirth, passportExpiryDate, ...rest } = updateStudentDto;

    // Remove undefined values to avoid Prisma relation errors
    const dataToUpdate: any = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined),
    );
    if (dateOfBirth) dataToUpdate.dateOfBirth = new Date(dateOfBirth);
    if (passportExpiryDate)
      dataToUpdate.passportExpiryDate = new Date(passportExpiryDate);

    return this.prisma.partnerStudent.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string, partnerIds?: string[]) {
    await this.findOne(id, partnerIds);
    return this.prisma.partnerStudent.delete({
      where: { id },
    });
  }
}
