import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import { FilterOptions, PaginationOptions } from '../common/filters/filter.interface';

@Injectable()
export class CitiesService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService
  ) {}

  async create(createCityDto: CreateCityDto) {
    const data = {
      nameUz: createCityDto.nameUz,
      nameRu: createCityDto.nameRu,
      nameEn: createCityDto.nameEn,
      descriptionUz: createCityDto.descriptionUz,
      descriptionRu: createCityDto.descriptionRu,
      descriptionEn: createCityDto.descriptionEn,
      country: { connect: { code: createCityDto.countryCode } }
    };

    return this.prisma.city.create({ data });
  }

  async createMany(cities: CreateCityDto[]) {
    const createdCities = await Promise.all(
      cities.map(cityDto => {
        return this.create(cityDto);
      })
    );
    
    return { 
      count: createdCities.length,
      cities: createdCities
    };
  }
  //check comment
  async findAll(countryCode?: number, lang: string = 'uz', paginationDto?: PaginationDto) {
    // Define filter options
    const filterOptions = {
      filters: [
        { field: 'countryCode', queryParam: 'countryCode' },
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
        'descriptionUz', 'descriptionRu', 'descriptionEn'
      ],
      searchMode: 'contains',
      caseSensitive: false
    };
    
    // Build filter query
    const query = { ...paginationDto, countryCode };
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
      this.prisma.city,
      where,
      paginationDto,
      { country: true },
      undefined,
      paginationOptions as PaginationOptions
    );
    
    // Localize results
    const localizedData = result.data.map(city => this.localizeCity(city, lang));
    
    return {
      data: localizedData,
      meta: result.meta
    };
  }

  async findOne(id: string, lang: string = 'uz') {
    const city = await this.prisma.city.findUnique({
      where: { id },
      include: {
        country: true,
      },
    });

    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }

    return this.localizeCity(city, lang);
  }

  async update(id: string, updateCityDto: UpdateCityDto) {
    try {
      const data: any = { ...updateCityDto };
      
      // Handle country relationship
      if (data.countryCode) {
        data.country = { connect: { code: data.countryCode } };
        delete data.countryCode;
      }
      
      return await this.prisma.city.update({
        where: { id },
        data
      });
    } catch (error) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.city.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }
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
    
    // Localize country if it exists
    if (result.country) {
      result.country = this.localizeCountry(result.country, lang);
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
} 