import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { ScholarshipProgramFilterDto } from './dto/scholarship-program-filter.dto';

@Injectable()
export class ScholarshipsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createScholarshipDto: CreateScholarshipDto) {
        const { universityId, programId } = createScholarshipDto;

        // Check if university exists
        const university = await this.prisma.university.findUnique({
            where: { id: universityId },
        });
        if (!university) {
            throw new NotFoundException(`University with ID ${universityId} not found`);
        }

        if (programId) {
            const program = await this.prisma.program.findUnique({
                where: { id: programId },
            });
            if (!program) {
                throw new NotFoundException(`Program with ID ${programId} not found`);
            }
        }

        const scholarship = await this.prisma.scholarship.create({
            data: createScholarshipDto,
        });

        await this.updateUniversityScholarshipStatus(universityId);

        return scholarship;
    }

    async findAll(query: { programId?: string, universityId?: string }) {
        return this.prisma.scholarship.findMany({
            where: {
                programId: query.programId,
                universityId: query.universityId,
            },
            include: {
                university: true,
                program: true,
            },
        });
    }

    async findOne(id: string) {
        const scholarship = await this.prisma.scholarship.findUnique({
            where: { id },
            include: {
                university: true,
                program: true,
            },
        });

        if (!scholarship) {
            throw new NotFoundException(`Scholarship with ID ${id} not found`);
        }

        return scholarship;
    }

    async update(id: string, updateScholarshipDto: UpdateScholarshipDto) {
        const scholarship = await this.findOne(id);

        const updatedScholarship = await this.prisma.scholarship.update({
            where: { id },
            data: updateScholarshipDto,
        });

        // If universityId changed, update both old and new universities
        if (updateScholarshipDto.universityId && updateScholarshipDto.universityId !== scholarship.universityId) {
            await this.updateUniversityScholarshipStatus(scholarship.universityId);
        }
        await this.updateUniversityScholarshipStatus(updatedScholarship.universityId);

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

    async findProgramsWithScholarships(filterDto: ScholarshipProgramFilterDto) {
        const { universityId, search } = filterDto;

        const where: any = {};

        if (universityId) {
            where.universityId = universityId;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.scholarship.findMany({
            where,
            include: {
                university: true,
                program: true,
            },
        });
    }

    private async updateUniversityScholarshipStatus(universityId: string) {
        const scholarships = await this.prisma.scholarship.findMany({
            where: { universityId },
            select: { requirements: true }
        });

        const hasScholarship = scholarships.length > 0;
        // Flatten and deduplicate requirements
        const allRequirements = scholarships.flatMap(s => s.requirements);
        const uniqueRequirements = [...new Set(allRequirements)];

        await this.prisma.university.update({
            where: { id: universityId },
            data: {
                hasScholarship,
                scholarshipRequirements: uniqueRequirements
            }
        });
    }
}
