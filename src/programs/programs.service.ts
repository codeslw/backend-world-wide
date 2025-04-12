import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import { FilterOptions, PaginationOptions } from 'src/common/filters/filter.interface';
import { EntityNotFoundException, InvalidDataException } from '../common/exceptions/app.exceptions';

@Injectable()
export class ProgramsService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService
  ) {}

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
          : undefined
      };

      return this.prisma.program.create({ data });
    } catch (error) {
      // Let the global exception filter handle Prisma errors
      throw error;
    }
  }

  async createMany(programs: CreateProgramDto[]) {
    try {
      const createdPrograms = await Promise.all(
        programs.map(programDto => {
          return this.create(programDto);
        })
      );
      
      return { 
        count: createdPrograms.length,
        programs: createdPrograms
      };
    } catch (error) {
      // Let the global exception filter handle Prisma errors
      throw error;
    }
  }

  async findAll(parentId?: string, lang: string = 'uz', paginationDto?: PaginationDto) {
    try {
      // Define filter options
      const filterOptions = {
        filters: [
          { field: 'parentId', queryParam: 'parentId' },
          { 
            field: 'createdAt', 
            queryParam: 'createdAfter', 
            operator: 'gte',
            transform: (value) => new Date(value)
          },
          { 
            field: 'createdAt', 
            queryParam: 'createdBefore', 
            operator: 'lte',
            transform: (value) => new Date(value)
          },
          {
            field: 'id',
            queryParam: 'ids',
            operator: 'in',
            isArray: true
          }
        ],
        searchFields: [
          'titleUz', 'titleRu', 'titleEn', 
          'descriptionUz', 'descriptionRu', 'descriptionEn'
        ],
        searchMode: 'contains',
        caseSensitive: false
      };
      
      // Build filter query
      const query = { ...paginationDto, parentId };
      const where = this.filterService.buildFilterQuery(query, filterOptions as FilterOptions);
      
      // Define pagination options
      const paginationOptions = {
        defaultLimit: 10,
        maxLimit: 50,
        defaultSortField: 'createdAt',
        defaultSortDirection: 'desc'
      };
      
      // Apply pagination and get results
      const result = await this.filterService.applyPagination(
        this.prisma.program,
        where,
        paginationDto,
        { parent: true, children: true },
        undefined,
        paginationOptions as PaginationOptions
      );
      
      // Localize results
      const localizedData = result.data.map(program => this.localizeProgram(program, lang));
      
      return {
        data: localizedData,
        meta: result.meta
      };
    } catch (error) {
      // Let the global exception filter handle database errors
      throw error;
    }
  }

  async findOne(id: string, lang: string = 'uz') {
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

      return this.localizeProgram(program, lang);
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
        where: { id }
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

      return await this.prisma.program.update({
        where: { id },
        data,
      });
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
      // First check if program exists
      const program = await this.prisma.program.findUnique({
        where: { id }
      });
      
      if (!program) {
        throw new EntityNotFoundException('Program', id);
      }
      
      return await this.prisma.program.delete({
        where: { id },
      });
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      // Otherwise let the global exception filter handle it
      throw error;
    }
  }

  private localizeProgram(program: any, lang: string) {
    const result = { ...program };
    
    // Set title based on language
    result.title = program[`title${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || 
                  program.titleUz || 
                  program.titleRu;
    
    // Set description based on language
    result.description = program[`description${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || 
                         program.descriptionUz || 
                         program.descriptionRu;
    
    // Localize parent if it exists
    if (result.parent) {
      result.parent = this.localizeProgram(result.parent, lang);
    }
    
    // Localize children if they exist
    if (result.children && result.children.length > 0) {
      result.children = result.children.map(child => this.localizeProgram(child, lang));
    }
    
    return result;
  }
} 