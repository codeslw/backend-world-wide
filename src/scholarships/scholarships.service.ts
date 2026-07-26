import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { Prisma, StudyLevel } from '@prisma/client';

/**
 * Minimal shape of a UniversityProgram needed to synthesise the legacy
 * `program` object that used to come from the global program catalog.
 */
type LegacyProgramSource = {
  id: string;
  title: string;
  slug: string | null;
  studyLevel: StudyLevel;
};

@Injectable()
export class ScholarshipsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The global `Program` catalog was retired: a UniversityProgram now owns its
   * own title/slug. Existing clients still read `program.{id,title,...}` off a
   * scholarship program, so we keep the key and populate it from the university
   * program itself. Prefer the flat `title`/`slug` fields in new code.
   */
  private attachLegacyProgram<P extends LegacyProgramSource>(program: P) {
    return {
      ...program,
      program: {
        id: program.id,
        title: program.title,
        slug: program.slug,
        studyLevel: program.studyLevel,
      },
    };
  }

  private attachLegacyPrograms<S extends { programs: LegacyProgramSource[] }>(
    scholarship: S,
  ) {
    return {
      ...scholarship,
      programs: scholarship.programs.map((program) =>
        this.attachLegacyProgram(program),
      ),
    };
  }

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
        programs: true,
      },
    });

    await this.updateUniversityScholarshipStatus(universityId);

    return this.attachLegacyPrograms(scholarship);
  }

  async findAll(query: {
    programId?: string;
    universityId?: string;
    onlyVisible?: boolean;
  }) {
    const where: Prisma.ScholarshipWhereInput = {};

    if (query.universityId) {
      where.universityId = query.universityId;
    }

    if (query.programId) {
      where.programs = {
        some: { id: query.programId },
      };
    }

    // When fetching for public listing, only return visible scholarships
    if (query.onlyVisible) {
      where.isVisible = true;
    }

    return this.prisma.scholarship.findMany({
      where,
      include: {
        university: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            photoUrl: true,
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
        programs: true,
      },
    });

    if (!scholarship) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }

    return this.attachLegacyPrograms(scholarship);
  }

  async getScholarshipPrograms(scholarshipId: string) {
    const count = await this.prisma.scholarship.count({
      where: { id: scholarshipId },
    });

    if (count === 0) {
      throw new NotFoundException(
        `Scholarship with ID ${scholarshipId} not found`,
      );
    }

    const programs = await this.prisma.universityProgram.findMany({
      where: {
        scholarships: {
          some: {
            id: scholarshipId,
          },
        },
      },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
        faculty: true,
        department: true,
        intakes: {
          include: {
            intake: true,
          },
        },
        campuses: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    return programs.map((program) => this.attachLegacyProgram(program));
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
        programs: true,
      },
    });

    // Update stats if university changed
    if (universityId && universityId !== scholarship.universityId) {
      await this.updateUniversityScholarshipStatus(scholarship.universityId);
    }
    await this.updateUniversityScholarshipStatus(
      updatedScholarship.universityId,
    );

    return this.attachLegacyPrograms(updatedScholarship);
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
    const [count, fullCount] = await Promise.all([
      this.prisma.scholarship.count({ where: { universityId } }),
      this.prisma.scholarship.count({ where: { universityId, isFullScholarship: true } }),
    ]);

    await this.prisma.university.update({
      where: { id: universityId },
      data: {
        hasScholarship: count > 0,
        hasFullScholarship: fullCount > 0,
        scholarshipRequirements: [],
      },
    });
  }
}
