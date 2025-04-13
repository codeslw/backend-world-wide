import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import { FilterOptions, PaginationOptions } from '../common/filters/filter.interface';
import { EntityNotFoundException, InvalidDataException } from '../common/exceptions/app.exceptions';

@Injectable()
export class CountriesService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService
  ) {}

  async create(createCountryDto: CreateCountryDto) {
    try {
      return this.prisma.country.create({ 
        data: {
          code: createCountryDto.code,
          nameUz: createCountryDto.nameUz,
          nameRu: createCountryDto.nameRu,
          nameEn: createCountryDto.nameEn
        } 
      });
    } catch (error) {
      // Let the global exception filter handle Prisma errors
      throw error;
    }
  }

  async createMany(countries: CreateCountryDto[]) {
    try {
      const createdCountries = await Promise.all(
        countries.map(countryDto => {
          return this.create(countryDto);
        })
      );
      
      return { 
        count: createdCountries.length,
        countries: createdCountries
      };
    } catch (error) {
      // Let the global exception filter handle Prisma errors
      throw error;
    }
  }

  async findAll(lang: string = 'uz', paginationDto?: PaginationDto) {
    try {
      // Define filter options
      const filterOptions = {
        filters: [
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
            field: 'code',
            queryParam: 'codes',
            operator: 'in',
            isArray: true
          }
        ],
        searchFields: [
          'nameUz', 'nameRu', 'nameEn', 
          'descriptionUz', 'descriptionRu', 'descriptionEn', 'code'
        ],
        searchMode: 'contains',
        caseSensitive: false
      };
      
      // Build filter query
      const where = this.filterService.buildFilterQuery(paginationDto || {}, filterOptions as FilterOptions);
      
      // Define pagination options
      const paginationOptions = {
        defaultLimit: 10,
        maxLimit: 300,
        defaultSortField: 'nameUz',
        defaultSortDirection: 'asc'
      };
      
      // Apply pagination and get results
      const result = await this.filterService.applyPagination(
        this.prisma.country,
        where,
        paginationDto,
        { cities: false },
        undefined,
        paginationOptions as PaginationOptions
      );
      
      // Localize results
      const localizedData = result.data.map(country => this.localizeCountry(country, lang));
      
      return {
        data: localizedData,
        meta: result.meta
      };
    } catch (error) {
      // Let the global exception filter handle database errors
      throw error;
    }
  }

  async findOne(code: number, lang: string = 'uz') {
    try {
      const country = await this.prisma.country.findUnique({
        where: { code },
        include: {
          cities: true,
        },
      });

      if (!country) {
        throw new EntityNotFoundException('Country', code);
      }

      return this.localizeCountry(country, lang);
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      // Otherwise let the global exception filter handle it
      throw error;
    }
  }

  async update(code: number, updateCountryDto: UpdateCountryDto) {
    try {
      // First check if country exists
      const country = await this.prisma.country.findUnique({
        where: { code }
      });
      
      if (!country) {
        throw new EntityNotFoundException('Country', code);
      }
      
      // Proceed with update
      return await this.prisma.country.update({
        where: { code },
        data: updateCountryDto,
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

  async remove(code: number) {
    try {
      // First check if country exists
      const country = await this.prisma.country.findUnique({
        where: { code }
      });
      
      if (!country) {
        throw new EntityNotFoundException('Country', code);
      }
      
      // Proceed with deletion
      return await this.prisma.country.delete({
        where: { code },
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
    
    // Localize cities if they exist
    if (result.cities && result.cities.length > 0) {
      result.cities = result.cities.map(city => {
        const localizedCity = { ...city };
        localizedCity.name = city[`name${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || 
                            city.nameUz || 
                            city.nameRu;
        localizedCity.description = city[`description${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || 
                                   city.descriptionUz || 
                                   city.descriptionRu;
        return localizedCity;
      });
    }
    
    return result;
  }
} 