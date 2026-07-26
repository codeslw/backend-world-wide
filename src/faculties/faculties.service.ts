import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import {
  EntityNotFoundException,
  InvalidDataException,
} from '../common/exceptions/app.exceptions';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { QueryFacultyDto } from './dto/query-faculty.dto';
import {
  FacultyResponseDto,
  PaginatedFacultyResponseDto,
} from './dto/faculty-response.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class FacultiesService {
  constructor(private prisma: PrismaService) {}

  async create(createFacultyDto: CreateFacultyDto): Promise<FacultyResponseDto> {
    await this.assertSlugIsFree(createFacultyDto.slug);

    const faculty = await this.prisma.faculty.create({
      data: {
        slug: createFacultyDto.slug,
        nameEn: createFacultyDto.nameEn,
        nameRu: createFacultyDto.nameRu,
        nameUz: createFacultyDto.nameUz,
        descriptionEn: createFacultyDto.descriptionEn,
        descriptionRu: createFacultyDto.descriptionRu,
        descriptionUz: createFacultyDto.descriptionUz,
        iconKey: createFacultyDto.iconKey,
        sortOrder: createFacultyDto.sortOrder ?? 0,
        isActive: createFacultyDto.isActive ?? true,
      },
    });

    return this.localizeFaculty(faculty, 'uz');
  }

  async findAll(
    query: QueryFacultyDto = {},
    lang = 'uz',
  ): Promise<PaginatedFacultyResponseDto> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = Math.min(query.limit && query.limit > 0 ? query.limit : 20, 200);
    const skip = (page - 1) * limit;

    const where: Prisma.FacultyWhereInput = {};

    if (typeof query.isActive === 'boolean') {
      where.isActive = query.isActive;
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameRu: { contains: search, mode: 'insensitive' } },
        { nameUz: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const include: Prisma.FacultyInclude = {};
    if (query.includeDepartments) {
      include.departments = {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
      };
    }
    if (query.includeProgramCount) {
      include._count = {
        select: { universityPrograms: { where: { isActive: true } } },
      };
    }

    const [faculties, total] = await this.prisma.$transaction([
      this.prisma.faculty.findMany({
        where,
        ...(Object.keys(include).length ? { include } : {}),
        orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.faculty.count({ where }),
    ]);

    return {
      data: faculties.map((faculty) => this.localizeFaculty(faculty, lang)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async findOne(idOrSlug: string, lang = 'uz'): Promise<FacultyResponseDto> {
    const where: Prisma.FacultyWhereUniqueInput = UUID_REGEX.test(idOrSlug)
      ? { id: idOrSlug }
      : { slug: idOrSlug };

    const faculty = await this.prisma.faculty.findUnique({
      where,
      include: {
        departments: {
          orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
        },
        _count: {
          select: { universityPrograms: { where: { isActive: true } } },
        },
      },
    });

    if (!faculty) {
      throw new EntityNotFoundException('Faculty', idOrSlug);
    }

    return this.localizeFaculty(faculty, lang);
  }

  async update(
    id: string,
    updateFacultyDto: UpdateFacultyDto,
  ): Promise<FacultyResponseDto> {
    const existing = await this.prisma.faculty.findUnique({ where: { id } });

    if (!existing) {
      throw new EntityNotFoundException('Faculty', id);
    }

    if (updateFacultyDto.slug && updateFacultyDto.slug !== existing.slug) {
      await this.assertSlugIsFree(updateFacultyDto.slug);
    }

    const faculty = await this.prisma.faculty.update({
      where: { id },
      data: {
        slug: updateFacultyDto.slug,
        nameEn: updateFacultyDto.nameEn,
        nameRu: updateFacultyDto.nameRu,
        nameUz: updateFacultyDto.nameUz,
        descriptionEn: updateFacultyDto.descriptionEn,
        descriptionRu: updateFacultyDto.descriptionRu,
        descriptionUz: updateFacultyDto.descriptionUz,
        iconKey: updateFacultyDto.iconKey,
        sortOrder: updateFacultyDto.sortOrder,
        isActive: updateFacultyDto.isActive,
      },
    });

    return this.localizeFaculty(faculty, 'uz');
  }

  async remove(id: string): Promise<void> {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: {
        _count: { select: { departments: true, universityPrograms: true } },
      },
    });

    if (!faculty) {
      throw new EntityNotFoundException('Faculty', id);
    }

    if (faculty._count.departments > 0) {
      throw new InvalidDataException(
        'Cannot delete a faculty that still has departments. Please move or delete its departments first.',
        {
          reason: 'RELATED_DEPARTMENTS_EXIST',
          count: faculty._count.departments,
        },
      );
    }

    if (faculty._count.universityPrograms > 0) {
      throw new InvalidDataException(
        'Cannot delete a faculty that is still referenced by university programs. Please reassign those programs first.',
        {
          reason: 'RELATED_PROGRAMS_EXIST',
          count: faculty._count.universityPrograms,
        },
      );
    }

    try {
      await this.prisma.faculty.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new InvalidDataException(
          'Cannot delete faculty because it is referenced by other records.',
          { reason: 'FOREIGN_KEY_CONSTRAINT', errorCode: error.code },
        );
      }
      throw error;
    }
  }

  private async assertSlugIsFree(slug: string): Promise<void> {
    const duplicate = await this.prisma.faculty.findUnique({ where: { slug } });

    if (duplicate) {
      throw new InvalidDataException(
        `A faculty with slug "${slug}" already exists.`,
        { reason: 'SLUG_ALREADY_EXISTS', slug, conflictingId: duplicate.id },
      );
    }
  }

  private getLangSuffix(lang: string): 'En' | 'Ru' | 'Uz' {
    const normalized = (lang || 'uz').toLowerCase().slice(0, 2);
    if (normalized === 'en') return 'En';
    if (normalized === 'ru') return 'Ru';
    return 'Uz';
  }

  private localizeFaculty(faculty: any, lang: string): FacultyResponseDto {
    const suffix = this.getLangSuffix(lang);
    const { _count, ...rest } = faculty ?? {};

    const result: FacultyResponseDto = {
      ...rest,
      name: faculty[`name${suffix}`] || faculty.nameEn || faculty.nameUz,
      description:
        faculty[`description${suffix}`] ??
        faculty.descriptionEn ??
        faculty.descriptionUz ??
        null,
    };

    if (result.departments) {
      result.departments = result.departments.map((department: any) =>
        this.localizeDepartment(department, lang),
      );
    }

    if (_count && typeof _count.universityPrograms === 'number') {
      result.programCount = _count.universityPrograms;
    }

    return result;
  }

  private localizeDepartment(department: any, lang: string) {
    const suffix = this.getLangSuffix(lang);
    const { _count, ...rest } = department ?? {};

    const result: any = {
      ...rest,
      name:
        department[`name${suffix}`] || department.nameEn || department.nameUz,
      description:
        department[`description${suffix}`] ??
        department.descriptionEn ??
        department.descriptionUz ??
        null,
    };

    if (_count && typeof _count.universityPrograms === 'number') {
      result.programCount = _count.universityPrograms;
    }

    return result;
  }
}
