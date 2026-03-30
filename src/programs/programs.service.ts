import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import {
  FilterOptions,
  PaginationOptions,
} from 'src/common/filters/filter.interface';
import {
  EntityNotFoundException,
  InvalidDataException,
} from '../common/exceptions/app.exceptions';
import { Prisma } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class ProgramsService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async clearProgramsCache() {
    try {
      // In-memory cache doesn't support pattern-based deletion,
      // so we reset all cache. With Redis, use pattern deletion instead.
      if (typeof (this.cacheManager as any).reset === 'function') {
        await (this.cacheManager as any).reset();
      } else if (typeof (this.cacheManager as any).clear === 'function') {
        await (this.cacheManager as any).clear();
      } else if (
        typeof (this.cacheManager as any).store?.reset === 'function'
      ) {
        await (this.cacheManager as any).store.reset();
      }
    } catch (e) {
      // Silently fail - cache miss on next request will repopulate
    }
  }

  async create(createProgramDto: CreateProgramDto) {
    try {
      const data = {
        titleUz: createProgramDto.titleUz,
        titleRu: createProgramDto.titleRu,
        titleEn: createProgramDto.titleEn,
        descriptionUz: createProgramDto.descriptionUz,
        descriptionRu: createProgramDto.descriptionRu,
        descriptionEn: createProgramDto.descriptionEn,
        parent: createProgramDto.parentId
          ? { connect: { id: createProgramDto.parentId } }
          : undefined,
      };

      const createdProgram = await this.prisma.program.create({ data });
      await this.clearProgramsCache();
      return createdProgram;
    } catch (error) {
      // Let the global exception filter handle Prisma errors
      throw error;
    }
  }

  async createMany(programs: CreateProgramDto[]) {
    try {
      const createdPrograms = await Promise.all(
        programs.map((programDto) => {
          return this.create(programDto);
        }),
      );

      await this.clearProgramsCache();
      return {
        count: createdPrograms.length,
        programs: createdPrograms,
      };
    } catch (error) {
      // Let the global exception filter handle Prisma errors
      throw error;
    }
  }

  async findAll(
    parentId?: string,
    lang: string = 'uz',
    paginationDto?: PaginationDto,
  ) {
    const cacheKey = `programs:all:${parentId || 'root'}:${lang}:${JSON.stringify(paginationDto)}`;
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    try {
      // Define filter options
      const filterOptions = {
        filters: [
          { field: 'parentId', queryParam: 'parentId' },
          {
            field: 'createdAt',
            queryParam: 'createdAfter',
            operator: 'gte',
            transform: (value) => new Date(value),
          },
          {
            field: 'createdAt',
            queryParam: 'createdBefore',
            operator: 'lte',
            transform: (value) => new Date(value),
          },
          {
            field: 'id',
            queryParam: 'ids',
            operator: 'in',
            isArray: true,
          },
        ],
        searchFields: [
          'titleUz',
          'titleRu',
          'titleEn',
          'descriptionUz',
          'descriptionRu',
          'descriptionEn',
        ],
        searchMode: 'contains',
        caseSensitive: false,
      };

      // Build filter query
      const query = { ...paginationDto, parentId };
      const where = this.filterService.buildFilterQuery(
        query,
        filterOptions as FilterOptions,
      );

      // Define pagination options
      const paginationOptions = {
        defaultLimit: 10,
        maxLimit: 300,
        defaultSortField: 'createdAt',
        defaultSortDirection: 'desc',
      };

      // Apply pagination and get results
      const result = await this.filterService.applyPagination(
        this.prisma.program,
        where,
        paginationDto,
        { parent: true, children: true },
        undefined,
        paginationOptions as PaginationOptions,
      );

      // Localize results
      const localizedData = result.data.map((program) =>
        this.localizeProgram(program, lang),
      );

      const finalResult = {
        data: localizedData,
        meta: result.meta,
      };
      await this.cacheManager.set(cacheKey, finalResult);
      return finalResult;
    } catch (error) {
      // Let the global exception filter handle database errors
      throw error;
    }
  }

  async findOne(id: string, lang: string = 'uz') {
    const cacheKey = `programs:one:${id}:${lang}`;
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    try {
      const program = await this.prisma.program.findUnique({
        where: { id },
        include: {
          parent: true,
          children: true,
        },
      });

      if (!program) {
        throw new EntityNotFoundException('Program', id);
      }

      const result = this.localizeProgram(program, lang);
      await this.cacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      // Otherwise let the global exception filter handle it
      throw error;
    }
  }

  async update(id: string, updateProgramDto: UpdateProgramDto) {
    try {
      // First check if program exists
      const program = await this.prisma.program.findUnique({
        where: { id },
      });

      if (!program) {
        throw new EntityNotFoundException('Program', id);
      }

      // Prepare data for update
      const data: any = { ...updateProgramDto };

      // Handle parent relationship if parentId is provided
      if (updateProgramDto.parentId) {
        data.parent = { connect: { id: updateProgramDto.parentId } };
        delete data.parentId;
      }

      const updatedProgram = await this.prisma.program.update({
        where: { id },
        data,
      });
      await this.clearProgramsCache();
      return updatedProgram;
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      // Otherwise let the global exception filter handle it
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // First check if program exists with relationships
      const program = await this.prisma.program.findUnique({
        where: { id },
        include: {
          children: true,
          universityPrograms: true,
        },
      });

      if (!program) {
        throw new EntityNotFoundException('Program', id);
      }

      // Check if there are children programs
      if (program.children.length > 0) {
        throw new InvalidDataException(
          'Cannot delete program with child programs. Please update or remove child programs first.',
          { reason: 'RELATED_CHILDREN_EXIST', count: program.children.length },
        );
      }

      // Check if program is associated with any universities
      if (program.universityPrograms.length > 0) {
        throw new InvalidDataException(
          'Cannot delete program that is offered by universities. Please remove university-program associations first.',
          {
            reason: 'RELATED_UNIVERSITIES_EXIST',
            count: program.universityPrograms.length,
          },
        );
      }

      const deletedProgram = await this.prisma.program.delete({
        where: { id },
      });
      await this.clearProgramsCache();
      return deletedProgram;
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (
        error instanceof EntityNotFoundException ||
        error instanceof InvalidDataException
      ) {
        throw error;
      }

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          // Foreign key constraint error
          throw new InvalidDataException(
            'Cannot delete program because it is referenced by other records.',
            { reason: 'FOREIGN_KEY_CONSTRAINT', errorCode: error.code },
          );
        }
      }

      // Otherwise let the global exception filter handle it
      throw error;
    }
  }

  private localizeProgram(program: any, lang: string) {
    const result = { ...program };

    // Set title based on language
    result.title =
      program[`title${lang.charAt(0).toUpperCase() + lang.slice(1)}`] ||
      program.titleUz ||
      program.titleRu;

    // Set description based on language
    result.description =
      program[`description${lang.charAt(0).toUpperCase() + lang.slice(1)}`] ||
      program.descriptionUz ||
      program.descriptionRu;

    // Localize parent if it exists
    if (result.parent) {
      result.parent = this.localizeProgram(result.parent, lang);
    }

    // Localize children if they exist
    if (result.children && result.children.length > 0) {
      result.children = result.children.map((child) =>
        this.localizeProgram(child, lang),
      );
    }

    return result;
  }
}
