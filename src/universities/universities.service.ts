import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import { FilterOptions, PaginationOptions } from '../common/filters/filter.interface';
import { EntityNotFoundException, InvalidDataException } from '../common/exceptions/app.exceptions';

@Injectable()
export class UniversitiesService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService
  ) {}

  async create(createUniversityDto: CreateUniversityDto) {
    try {
      const data = {
        nameUz: createUniversityDto.nameUz,
        nameRu: createUniversityDto.nameRu,
        nameEn: createUniversityDto.nameEn,
        established: createUniversityDto.established,
        type: createUniversityDto.type,
        avgApplicationFee: createUniversityDto.avgApplicationFee,
        country: { connect: { code: createUniversityDto.countryCode } },
        city: { connect: { id: createUniversityDto.cityId } },
        descriptionUz: createUniversityDto.descriptionUz,
        descriptionRu: createUniversityDto.descriptionRu,
        descriptionEn: createUniversityDto.descriptionEn,
        winterIntakeDeadline: createUniversityDto.winterIntakeDeadline,
        autumnIntakeDeadline: createUniversityDto.autumnIntakeDeadline,
        ranking: createUniversityDto.ranking,
        studentsCount: createUniversityDto.studentsCount,
        acceptanceRate: createUniversityDto.acceptanceRate,
        website: createUniversityDto.website,
        tuitionFeeMax: createUniversityDto.tuitionFeeMax,
        tuitionFeeMin: createUniversityDto.tuitionFeeMin,
        tuitionFeeCurrency: createUniversityDto.tuitionFeeCurrency,
        photoUrl: createUniversityDto.photoUrl,
        email: createUniversityDto.email,
        phone: createUniversityDto.phone,
        address: createUniversityDto.address,
        programs: { connect: createUniversityDto.programs.map(program => ({ id: program })) }
      };

      return this.prisma.university.create({ data });
    } catch (error) {
      // Let the global exception filter handle Prisma errors
      throw error;
    }
  }

  async findAll(
    countryCode?: number, 
    cityId?: string, 
    type?: string,
    lang: string = 'uz', 
    paginationDto?: PaginationDto
  ) {
    try {
      // Define filter options
      const filterOptions = {
        filters: [
          { field: 'countryCode', queryParam: 'countryCode' },
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
          },
          {
            field: 'programs',
            queryParam: 'programs',
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
      
      // Build filter query with proper handling of optional parameters
      const query: Record<string, any> = {
        ...paginationDto
      };
      
      // Only add parameters to the query if they have valid values
      if (countryCode !== undefined && countryCode !== null) {
        query.countryCode = countryCode;
      }
      
      if (cityId) {
        query.cityId = cityId;
      }
      
      if (type) {
        query.type = type;
      }
      
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
          programs: true
        },
        undefined,
        paginationOptions as PaginationOptions,
      );
      
      if (result.data.length === 0 && (countryCode || cityId || type)) {
        // If specific filters were provided but no results found, return empty result
        // but don't throw an error - this is expected behavior for search/filters
        return {
          data: [],
          meta: result.meta
        };
      }
      
      // Localize results
      const localizedData = result.data.map(university => this.localizeUniversity(university, lang));
      
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
      const university = await this.prisma.university.findUnique({
        where: { id },
        include: {
          country: true,
          city: true,
          programs: true
        },
      });

      if (!university) {
        throw new EntityNotFoundException('University', id);
      }

      return this.localizeUniversity(university, lang);
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      // Otherwise let the global exception filter handle it
      throw error;
    }
  }

  async update(id: string, updateUniversityDto: UpdateUniversityDto) {
    try {
      // First check if university exists
      const university = await this.prisma.university.findUnique({
        where: { id }
      });
      
      if (!university) {
        throw new EntityNotFoundException('University', id);
      }
      
      // Extract relation fields for proper formatting
      const { countryCode, cityId, programs, ...otherFields } = updateUniversityDto;

      // Prepare the data object for Prisma
      const data: any = { ...otherFields };
      
      // Add relation fields if they exist
      if (countryCode) {
        data.country = { connect: { code: countryCode } };
      }
      
      if (cityId) {
        data.city = { connect: { id: cityId } };
      }
      
      if (programs && programs.length > 0) {
        data.programs = { 
          set: [], // Clear existing connections
          connect: programs.map(programId => ({ id: programId }))
        };
      }
      
      // Proceed with update
      return await this.prisma.university.update({
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
      // First check if university exists
      const university = await this.prisma.university.findUnique({
        where: { id }
      });
      
      if (!university) {
        throw new EntityNotFoundException('University', id);
      }
      
      // Proceed with deletion
      return await this.prisma.university.delete({
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

  async createMany(createUniversityDtos: CreateUniversityDto[]) {
    // Use a transaction to ensure all universities are created or none
    return this.prisma.$transaction(async (prisma) => {
      const createdUniversities = [];
      
      for (const dto of createUniversityDtos) {
        const university = await prisma.university.create({
          data: {
            nameUz: dto.nameUz,
            nameRu: dto.nameRu,
            nameEn: dto.nameEn,
            established: dto.established,
            type: dto.type,
            avgApplicationFee: dto.avgApplicationFee,
            country: { connect: { code: dto.countryCode } },
            city: { connect: { id: dto.cityId } },
            descriptionUz: dto.descriptionUz,
            descriptionRu: dto.descriptionRu,
            descriptionEn: dto.descriptionEn,
            winterIntakeDeadline: dto.winterIntakeDeadline,
            autumnIntakeDeadline: dto.autumnIntakeDeadline,
            ranking: dto.ranking,
            studentsCount: dto.studentsCount,
            acceptanceRate: dto.acceptanceRate,
            website: dto.website,
            tuitionFeeMax: dto.tuitionFeeMax,
            tuitionFeeMin: dto.tuitionFeeMin,
            tuitionFeeCurrency: dto.tuitionFeeCurrency,
            photoUrl: dto.photoUrl,
            email: dto.email,
            phone: dto.phone,
            address: dto.address
          },
        });
        
        createdUniversities.push(university);
      }
      
      return createdUniversities;
    });
  }
} 