import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import { FilterOptions, PaginationOptions } from '../common/filters/filter.interface';

@Injectable()
export class CountriesService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService
  ) {}

  async create(createCountryDto: CreateCountryDto) {
    return this.prisma.country.create({ data: createCountryDto });
  }

  async createMany(countries: CreateCountryDto[]) {
    const createdCountries = await Promise.all(
      countries.map(countryDto => {
        return this.create(countryDto);
      })
    );
    
    return { 
      count: createdCountries.length,
      countries: createdCountries
    };
  }

  async findAll(lang: string = 'uz', paginationDto?: PaginationDto) {
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
          field: 'id',
          queryParam: 'ids',
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
      maxLimit: 50,
      defaultSortField: 'createdAt',
      defaultSortDirection: 'desc'
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
  }

  async findOne(id: string, lang: string = 'uz') {
    const country = await this.prisma.country.findUnique({
      where: { id },
      include: {
        cities: true,
      },
    });

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    return this.localizeCountry(country, lang);
  }

  async update(id: string, updateCountryDto: UpdateCountryDto) {
    try {
      return await this.prisma.country.update({
        where: { id },
        data: updateCountryDto,
      });
    } catch (error) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.country.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Country with ID ${id} not found`);
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
    // if (result.cities && result.cities.length > 0) {
    //   result.cities = result.cities.map(city => {
    //     const localizedCity = { ...city };
    //     localizedCity.name = city[`name${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || 
    //                         city.nameUz || 
    //                         city.nameRu;
    //     localizedCity.description = city[`description${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || 
    //                                city.descriptionUz || 
    //                                city.descriptionRu;
    //     return localizedCity;
    //   });
    // }
    
    return result;
  }
} 