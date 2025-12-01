import {
    Injectable,
    NotFoundException,
    ConflictException,
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

        // Check if university and program exist
        const university = await this.prisma.university.findUnique({
            where: { id: universityId },
        });
        if (!university) {
            throw new NotFoundException(`University with ID ${universityId} not found`);
        }

        const program = await this.prisma.program.findUnique({
            where: { id: programId },
        });
        if (!program) {
            throw new NotFoundException(`Program with ID ${programId} not found`);
        }

        // Check if scholarship already exists for this university and program
        const existingScholarship = await this.prisma.scholarship.findUnique({
            where: {
                universityId_programId: {
                    universityId,
                    programId,
                },
            },
        });

        if (existingScholarship) {
            throw new ConflictException(
                'Scholarship for this university and program already exists',
            );
        }

        return this.prisma.scholarship.create({
            data: createScholarshipDto,
        });
    }

    async findAll() {
        return this.prisma.scholarship.findMany({
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
        await this.findOne(id); // Ensure exists

        return this.prisma.scholarship.update({
            where: { id },
            data: updateScholarshipDto,
        });
    }

    async remove(id: string) {
        await this.findOne(id); // Ensure exists

        return this.prisma.scholarship.delete({
            where: { id },
        });
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

        // We want to return university programs that have scholarships.
        // The Scholarship model links University and Program.
        // So we can query Scholarships and include the related University and Program data.
        // Or we can query UniversityProgram if we had a direct link, but we linked Scholarship to University and Program directly.
        // The user asked for "university programs that have scolarships".
        // I'll return the Scholarships with their associated University and Program.

        return this.prisma.scholarship.findMany({
            where,
            include: {
                university: true,
                program: true,
            },
        });
    }
}
