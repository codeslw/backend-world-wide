import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import {
  EntityNotFoundException,
  InvalidDataException,
} from '../common/exceptions/app.exceptions';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';
import {
  DepartmentResponseDto,
  PaginatedDepartmentResponseDto,
} from './dto/department-response.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    await this.assertFacultyExists(createDepartmentDto.facultyId);
    await this.assertSlugIsFree(
      createDepartmentDto.facultyId,
      createDepartmentDto.slug,
    );

    const department = await this.prisma.department.create({
      data: {
        facultyId: createDepartmentDto.facultyId,
        slug: createDepartmentDto.slug,
        nameEn: createDepartmentDto.nameEn,
        nameRu: createDepartmentDto.nameRu,
        nameUz: createDepartmentDto.nameUz,
        descriptionEn: createDepartmentDto.descriptionEn,
        descriptionRu: createDepartmentDto.descriptionRu,
        descriptionUz: createDepartmentDto.descriptionUz,
        sortOrder: createDepartmentDto.sortOrder ?? 0,
        isActive: createDepartmentDto.isActive ?? true,
      },
    });

    return this.localizeDepartment(department, 'uz');
  }

  async findAll(
    query: QueryDepartmentDto = {},
    lang = 'uz',
  ): Promise<PaginatedDepartmentResponseDto> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = Math.min(query.limit && query.limit > 0 ? query.limit : 20, 200);
    const skip = (page - 1) * limit;

    const where: Prisma.DepartmentWhereInput = {};

    if (query.facultyId) {
      where.facultyId = query.facultyId;
    }

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

    const include: Prisma.DepartmentInclude = {};
    if (query.includeProgramCount) {
      include._count = {
        select: { universityPrograms: { where: { isActive: true } } },
      };
    }

    const [departments, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where,
        ...(Object.keys(include).length ? { include } : {}),
        orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.department.count({ where }),
    ]);

    return {
      data: departments.map((department) =>
        this.localizeDepartment(department, lang),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async findOne(id: string, lang = 'uz'): Promise<DepartmentResponseDto> {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        faculty: true,
        _count: {
          select: { universityPrograms: { where: { isActive: true } } },
        },
      },
    });

    if (!department) {
      throw new EntityNotFoundException('Department', id);
    }

    return this.localizeDepartment(department, lang);
  }

  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    const existing = await this.prisma.department.findUnique({ where: { id } });

    if (!existing) {
      throw new EntityNotFoundException('Department', id);
    }

    const targetFacultyId = updateDepartmentDto.facultyId ?? existing.facultyId;

    if (
      updateDepartmentDto.facultyId &&
      updateDepartmentDto.facultyId !== existing.facultyId
    ) {
      await this.assertFacultyExists(updateDepartmentDto.facultyId);
    }

    const targetSlug = updateDepartmentDto.slug ?? existing.slug;
    if (targetSlug !== existing.slug || targetFacultyId !== existing.facultyId) {
      await this.assertSlugIsFree(targetFacultyId, targetSlug, id);
    }

    const department = await this.prisma.department.update({
      where: { id },
      data: {
        facultyId: updateDepartmentDto.facultyId,
        slug: updateDepartmentDto.slug,
        nameEn: updateDepartmentDto.nameEn,
        nameRu: updateDepartmentDto.nameRu,
        nameUz: updateDepartmentDto.nameUz,
        descriptionEn: updateDepartmentDto.descriptionEn,
        descriptionRu: updateDepartmentDto.descriptionRu,
        descriptionUz: updateDepartmentDto.descriptionUz,
        sortOrder: updateDepartmentDto.sortOrder,
        isActive: updateDepartmentDto.isActive,
      },
    });

    return this.localizeDepartment(department, 'uz');
  }

  async remove(id: string): Promise<void> {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { universityPrograms: true } } },
    });

    if (!department) {
      throw new EntityNotFoundException('Department', id);
    }

    if (department._count.universityPrograms > 0) {
      throw new InvalidDataException(
        'Cannot delete a department that is still referenced by university programs. Please reassign those programs first.',
        {
          reason: 'RELATED_PROGRAMS_EXIST',
          count: department._count.universityPrograms,
        },
      );
    }

    try {
      await this.prisma.department.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new InvalidDataException(
          'Cannot delete department because it is referenced by other records.',
          { reason: 'FOREIGN_KEY_CONSTRAINT', errorCode: error.code },
        );
      }
      throw error;
    }
  }

  private async assertFacultyExists(facultyId: string): Promise<void> {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id: facultyId },
      select: { id: true },
    });

    if (!faculty) {
      throw new EntityNotFoundException('Faculty', facultyId);
    }
  }

  private async assertSlugIsFree(
    facultyId: string,
    slug: string,
    ignoreId?: string,
  ): Promise<void> {
    const duplicate = await this.prisma.department.findUnique({
      where: { facultyId_slug: { facultyId, slug } },
    });

    if (duplicate && duplicate.id !== ignoreId) {
      throw new InvalidDataException(
        `A department with slug "${slug}" already exists in this faculty. Department slugs must be unique per faculty.`,
        {
          reason: 'SLUG_ALREADY_EXISTS_IN_FACULTY',
          slug,
          facultyId,
          conflictingId: duplicate.id,
        },
      );
    }
  }

  private getLangSuffix(lang: string): 'En' | 'Ru' | 'Uz' {
    const normalized = (lang || 'uz').toLowerCase().slice(0, 2);
    if (normalized === 'en') return 'En';
    if (normalized === 'ru') return 'Ru';
    return 'Uz';
  }

  private localizeDepartment(
    department: any,
    lang: string,
  ): DepartmentResponseDto {
    const suffix = this.getLangSuffix(lang);
    const { _count, ...rest } = department ?? {};

    const result: DepartmentResponseDto = {
      ...rest,
      name:
        department[`name${suffix}`] || department.nameEn || department.nameUz,
      description:
        department[`description${suffix}`] ??
        department.descriptionEn ??
        department.descriptionUz ??
        null,
    };

    if (result.faculty) {
      result.faculty = this.localizeFaculty(result.faculty, lang);
    }

    if (_count && typeof _count.universityPrograms === 'number') {
      result.programCount = _count.universityPrograms;
    }

    return result;
  }

  private localizeFaculty(faculty: any, lang: string) {
    const suffix = this.getLangSuffix(lang);
    const { _count, ...rest } = faculty ?? {};

    const result: any = {
      ...rest,
      name: faculty[`name${suffix}`] || faculty.nameEn || faculty.nameUz,
      description:
        faculty[`description${suffix}`] ??
        faculty.descriptionEn ??
        faculty.descriptionUz ??
        null,
    };

    if (_count && typeof _count.universityPrograms === 'number') {
      result.programCount = _count.universityPrograms;
    }

    return result;
  }
}
