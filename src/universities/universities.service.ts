import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import { FilterOptions, PaginationOptions } from '../common/filters/filter.interface';

@Injectable()
export class UniversitiesService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService
  ) {}

  async create(createUniversityDto: CreateUniversityDto) {
    return this.prisma.university.create({
      data: {
        nameUz: createUniversityDto.nameUz,
        nameRu: createUniversityDto.nameRu,
        nameEn: createUniversityDto.nameEn,
        established: createUniversityDto.established,
        type: createUniversityDto.type,
        avgApplicationFee: createUniversityDto.avgApplicationFee,
        countryId: createUniversityDto.countryId,
        cityId: createUniversityDto.cityId,
        descriptionUz: createUniversityDto.descriptionUz,
        descriptionRu: createUniversityDto.descriptionRu,
        descriptionEn: createUniversityDto.descriptionEn,
        winterIntakeDeadline: createUniversityDto.winterIntakeDeadline,
        autumnIntakeDeadline: createUniversityDto.autumnIntakeDeadline,
        ranking: createUniversityDto.ranking,
        studentsCount: createUniversityDto.studentsCount,
        acceptanceRate: createUniversityDto.acceptanceRate,
        website: createUniversityDto.website,
        tuitionFeeMax : createUniversityDto.tuitionFeeMax,
        tuitionFeeMin : createUniversityDto.tuitionFeeMin,
        tuitionFeeCurrency : createUniversityDto.tuitionFeeCurrency
        
      },
    });
  }

  async findAll(
    countryId?: string, 
    cityId?: string, 
    type?: string,
    lang: string = 'uz', 
    paginationDto?: PaginationDto
  ) {
    // Define filter options
    const filterOptions = {
      filters: [
        { field: 'countryId', queryParam: 'countryId' },
        { field: 'cityId', queryParam: 'cityId' },
        { field: 'type', queryParam: 'type' },
        { 
          field: 'ranking', 
          queryParam: 'minRanking', 
          operator: 'gte',
          transform: (value) => parseInt(value)
        },
        { 
          field: 'ranking', 
          queryParam: 'maxRanking', 
          operator: 'lte',
          transform: (value) => parseInt(value)
        },
        { 
          field: 'established', 
          queryParam: 'minEstablished', 
          operator: 'gte',
          transform: (value) => parseInt(value)
        },
        { 
          field: 'established', 
          queryParam: 'maxEstablished', 
          operator: 'lte',
          transform: (value) => parseInt(value)
        },
        { 
          field: 'acceptanceRate', 
          queryParam: 'minAcceptanceRate', 
          operator: 'gte',
          transform: (value) => parseFloat(value)
        },
        { 
          field: 'acceptanceRate', 
          queryParam: 'maxAcceptanceRate', 
          operator: 'lte',
          transform: (value) => parseFloat(value)
        },
        { 
          field: 'avgApplicationFee', 
          queryParam: 'minApplicationFee', 
          operator: 'gte',
          transform: (value) => parseFloat(value)
        },
        { 
          field: 'avgApplicationFee', 
          queryParam: 'maxApplicationFee', 
          operator: 'lte',
          transform: (value) => parseFloat(value)
        },
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
        'nameUz', 'nameRu', 'nameEn', 
        'descriptionUz', 'descriptionRu', 'descriptionEn',
        'website'
      ],
      searchMode: 'contains',
      caseSensitive: false
    };
    
    // Build filter query
    const query = { 
      ...paginationDto, 
      countryId, 
      cityId,
      type
    };
    
    const where = this.filterService.buildFilterQuery(query, filterOptions as FilterOptions);
    
    // Define pagination options
    const paginationOptions = {
      defaultLimit: 10,
      maxLimit: 50,
      defaultSortField: 'ranking',
      defaultSortDirection: 'asc'
    };
    
    // Apply pagination and get results
    const result = await this.filterService.applyPagination(
      this.prisma.university,
      where,
      paginationDto,
      { 
        country: true, 
        city: true, 
        tuitionFee: true,
        programs: true
      },
      undefined,
      paginationOptions as PaginationOptions
    );
    
    // Localize results
    const localizedData = result.data.map(university => this.localizeUniversity(university, lang));
    
    return {
      data: localizedData,
      meta: result.meta
    };
  }

  async findOne(id: string, lang: string = 'uz') {
    const university = await this.prisma.university.findUnique({
      where: { id },
      include: {
        country: true,
        city: true,
        programs: true
      },
    });

    if (!university) {
      throw new NotFoundException(`University with ID ${id} not found`);
    }

    return this.localizeUniversity(university, lang);
  }

  async update(id: string, updateUniversityDto: UpdateUniversityDto) {
    try {
      const data: any = { ...updateUniversityDto };
      
      // Handle date fields
      if (data.winterIntakeDeadline) {
        data.winterIntakeDeadline = new Date(data.winterIntakeDeadline);
      }
      
      if (data.autumnIntakeDeadline) {
        data.autumnIntakeDeadline = new Date(data.autumnIntakeDeadline);
      }
      
      // Handle relations
      if (data.countryId) {
        data.country = { connect: { id: data.countryId } };
        delete data.countryId;
      }
      
      if (data.cityId) {
        data.city = { connect: { id: data.cityId } };
        delete data.cityId;
      }
      
      if (data.tuitionFeeId) {
        data.tuitionFee = { connect: { id: data.tuitionFeeId } };
        delete data.tuitionFeeId;
      }

      return await this.prisma.university.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new NotFoundException(`University with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.university.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`University with ID ${id} not found`);
    }
  }

  private localizeUniversity(university: any, lang: string) {
    const result = { ...university };
    
    // Set name based on language
    result.name = university[`name${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || 
                  university.nameUz || 
                  university.nameRu;
    
    // Set description based on language
    result.description = university[`description${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || 
                         university.descriptionUz || 
                         university.descriptionRu;
    
    // Localize country if it exists
    if (result.country) {
      result.country = this.localizeCountry(result.country, lang);
    }
    
    // Localize city if it exists
    if (result.city) {
      result.city = this.localizeCity(result.city, lang);
    }
    
    // Localize programs if they exist
    if (result.programs && result.programs.length > 0) {
      result.programs = result.programs.map(program => this.localizeProgram(program, lang));
    }
    
    return result;
  }

  private localizeCountry(country: any, lang: string) {
    const result = { ...country };
    
    // Set name based on language
    result.name = country[`name${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || 
                  country.nameUz || 
                  country.nameRu;
    
    // Set description based on language
    result.description = country[`description${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || 
                         country.descriptionUz || 
                         country.descriptionRu;
    
    return result;
  }

  private localizeCity(city: any, lang: string) {
    const result = { ...city };
    
    // Set name based on language
    result.name = city[`name${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || 
                  city.nameUz || 
                  city.nameRu;
    
    // Set description based on language
    result.description = city[`description${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || 
                         city.descriptionUz || 
                         city.descriptionRu;
    
    return result;
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
    
    return result;
  }
} 