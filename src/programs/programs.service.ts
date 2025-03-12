import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import { FilterOptions, PaginationOptions } from 'src/common/filters/filter.interface';

@Injectable()
export class ProgramsService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService
  ) {}

  async create(createProgramDto: CreateProgramDto) {
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
  }

  async findAll(parentId?: string, lang: string = 'uz', paginationDto?: PaginationDto) {
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
  }

  async findOne(id: string, lang: string = 'uz') {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    return this.localizeProgram(program, lang);
  }

  async update(id: string, updateProgramDto: UpdateProgramDto) {
    try {
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
      throw new NotFoundException(`Program with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.program.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }
  }

  private localizeProgram(program: any, lang: string) {
    const result = { ...program };
    
    // Set name based on language
    result.name = program[`name${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || 
                  program.nameUz || 
                  program.nameRu;
    
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