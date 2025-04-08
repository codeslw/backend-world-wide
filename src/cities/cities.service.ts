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
    const city = await this.prisma.city.create({
      data: {
        nameUz: createCityDto.nameUz,
        nameRu: createCityDto.nameRu,
        nameEn: createCityDto.nameEn,
        countryCode: createCityDto.countryCode,
      },
      include: {
        country: true,
      },
    });
    return city;
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

  async findAll(countryCode?: number, lang: string = 'uz', paginationDto?: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const where = countryCode ? { countryCode } : {};

    const [cities, total] = await Promise.all([
      this.prisma.city.findMany({
        where,
        skip,
        take: limit,
        include: {
          country: true,
        },
        orderBy: {
          [`name${lang.charAt(0).toUpperCase() + lang.slice(1)}`]: 'asc',
        },
      }),
      this.prisma.city.count({ where }),
    ]);

    return {
      data: cities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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

    return city;
  }

  async update(id: string, updateCityDto: UpdateCityDto) {
    const city = await this.prisma.city.update({
      where: { id },
      data: {
        nameUz: updateCityDto.nameUz,
        nameRu: updateCityDto.nameRu,
        nameEn: updateCityDto.nameEn,
        countryCode: updateCityDto.countryCode,
      },
      include: {
        country: true,
      },
    });

    return city;
  }

  async remove(id: string) {
    const city = await this.prisma.city.delete({
      where: { id },
      include: {
        country: true,
      },
    });

    return city;
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