import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ScholarshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createScholarshipDto: CreateScholarshipDto) {
    const { universityId, programIds, ...rest } = createScholarshipDto;

    // Check if university exists
    const university = await this.prisma.university.findUnique({
      where: { id: universityId },
    });
    if (!university) {
      throw new NotFoundException(
        `University with ID ${universityId} not found`,
      );
    }

    // Validate programs if provided
    if (programIds && programIds.length > 0) {
      const count = await this.prisma.universityProgram.count({
        where: { id: { in: programIds } },
      });
      if (count !== programIds.length) {
        throw new NotFoundException(`One or more programs not found`);
      }
    }

    const scholarship = await this.prisma.scholarship.create({
      data: {
        ...rest,
        universityId,
        programs: programIds
          ? {
              connect: programIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        university: true,
        programs: {
          include: {
            program: true,
          },
        },
      },
    });

    await this.updateUniversityScholarshipStatus(universityId);

    return scholarship;
  }

  async findAll(query: { programId?: string; universityId?: string }) {
    const where: Prisma.ScholarshipWhereInput = {};

    if (query.universityId) {
      where.universityId = query.universityId;
    }

    if (query.programId) {
      where.programs = {
        some: { id: query.programId },
      };
    }

    return this.prisma.scholarship.findMany({
      where,
      include: {
        university: true,
        programs: {
          include: {
            program: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const scholarship = await this.prisma.scholarship.findUnique({
      where: { id },
      include: {
        university: true,
        programs: {
          include: {
            program: true,
          },
        },
      },
    });

    if (!scholarship) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }

    return scholarship;
  }

  async update(id: string, updateScholarshipDto: UpdateScholarshipDto) {
    const scholarship = await this.findOne(id);
    const { programIds, universityId, ...rest } = updateScholarshipDto;

    const data: Prisma.ScholarshipUpdateInput = {
      ...rest,
    };

    if (universityId) {
      data.university = { connect: { id: universityId } };
    }

    if (programIds !== undefined) {
      data.programs = {
        set: programIds.map((pid) => ({ id: pid })),
      };
    }

    const updatedScholarship = await this.prisma.scholarship.update({
      where: { id },
      data,
      include: {
        university: true,
        programs: {
          include: {
            program: true,
          },
        },
      },
    });

    // Update stats if university changed
    if (universityId && universityId !== scholarship.universityId) {
      await this.updateUniversityScholarshipStatus(scholarship.universityId);
    }
    await this.updateUniversityScholarshipStatus(
      updatedScholarship.universityId,
    );

    return updatedScholarship;
  }

  async remove(id: string) {
    const scholarship = await this.findOne(id);

    await this.prisma.scholarship.delete({
      where: { id },
    });

    await this.updateUniversityScholarshipStatus(scholarship.universityId);

    return { message: 'Scholarship deleted successfully' };
  }

  private async updateUniversityScholarshipStatus(universityId: string) {
    const scholarships = await this.prisma.scholarship.findMany({
      where: { universityId },
    });

    const hasScholarship = scholarships.length > 0;

    await this.prisma.university.update({
      where: { id: universityId },
      data: {
        hasScholarship,
        scholarshipRequirements: [],
      },
    });
  }
}
