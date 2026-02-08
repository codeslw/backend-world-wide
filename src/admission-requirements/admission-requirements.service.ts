import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAdmissionRequirementDto } from './dto/create-admission-requirement.dto';
import { UpdateAdmissionRequirementDto } from './dto/update-admission-requirement.dto';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class AdmissionRequirementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateAdmissionRequirementDto) {
    const { universityId, programLevel, ...data } = createDto;

    const university = await this.prisma.university.findUnique({
      where: { id: universityId },
    });
    if (!university) {
      throw new NotFoundException('University not found');
    }

    // Check strict uniqueness for universityId + programLevel
    const existing = await this.prisma.admissionRequirement.findUnique({
      where: {
        universityId_programLevel: {
          universityId,
          programLevel,
        },
      },
    });

    if (existing) {
      // If it exists, maybe we update? Or throw?
      // Since it's create, let's throw conflict or just update.
      // The user wants CRUD. Let's start with proper Create behavior (fail if exists).
      // Or we can use upsert logic if we want idempotency.
      throw new Error(
        `Admission requirement for this university and level already exists. Use update.`,
      );
    }

    return this.prisma.admissionRequirement.create({
      data: {
        university: { connect: { id: universityId } },
        programLevel,
        ...data,
        languageRequirements: data.languageRequirements as any,
      },
    });
  }

  async findAll() {
    return this.prisma.admissionRequirement.findMany({
      include: { university: true },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.admissionRequirement.findUnique({
      where: { id },
      include: { university: true },
    });
    if (!record) throw new NotFoundException('Admission requirement not found');
    return record;
  }

  async findByUniversity(universityId: string) {
    return this.prisma.admissionRequirement.findMany({
      where: { universityId },
      orderBy: { programLevel: 'asc' },
    });
  }

  async update(id: string, updateDto: UpdateAdmissionRequirementDto) {
    const record = await this.prisma.admissionRequirement.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException(
        `Admission requirement with ID ${id} not found`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { universityId, languageRequirements, ...rest } = updateDto;

    return this.prisma.admissionRequirement.update({
      where: { id },
      data: {
        ...rest,
        languageRequirements: languageRequirements as any,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.admissionRequirement.delete({ where: { id } });
  }
}
