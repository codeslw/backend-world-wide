import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import {
  FilterOptions,
  PaginationOptions,
} from '../common/filters/filter.interface';
import {
  EntityNotFoundException,
  InvalidDataException,
} from '../common/exceptions/app.exceptions';

@Injectable()
export class CitiesService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService,
  ) {}

  async create(createCityDto: CreateCityDto) {
    try {
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
    } catch (error) {
      // Let the global exception filter handle Prisma errors
      throw error;
    }
  }

  async createMany(cities: CreateCityDto[]) {
    try {
      const createdCities = await Promise.all(
        cities.map((cityDto) => {
          return this.create(cityDto);
        }),
      );

      return {
        count: createdCities.length,
        cities: createdCities,
      };
    } catch (error) {
      // Let the global exception filter handle Prisma errors
      throw error;
    }
  }

  async findAll(
    lang: string = 'uz',
    page: number = 1,
    limit: number = 10,
    countryCode?: number,
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: any = {};
      if (countryCode !== undefined) {
        where.countryCode = countryCode;
      }

      // Extract the primary language code
      let primaryLanguage = lang.split('-')[0].split(',')[0];
      // Default to 'en' if the parsed language is not one of the expected (uz, ru, en)
      if (!['uz', 'ru', 'en'].includes(primaryLanguage)) {
        primaryLanguage = 'en';
      }

      const orderByField = `name${primaryLanguage.charAt(0).toUpperCase() + primaryLanguage.slice(1)}`;

      const [cities, total] = await Promise.all([
        this.prisma.city.findMany({
          where,
          skip,
          take: limit,
          include: {
            country: true,
          },
          orderBy: {
            [orderByField]: 'asc',
          },
        }),
        this.prisma.city.count({ where }),
      ]);

      // Map cities to localized format
      const localizedCities = cities.map((city) =>
        this.localizeCity(city, lang),
      );

      return {
        data: localizedCities,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      // Let the global exception filter handle database errors
      throw error;
    }
  }

  async findOne(id: string, lang: string = 'uz') {
    try {
      const city = await this.prisma.city.findUnique({
        where: { id },
        include: {
          country: true,
        },
      });

      if (!city) {
        throw new EntityNotFoundException('City', id);
      }

      return this.localizeCity(city, lang);
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      // Otherwise let the global exception filter handle it
      throw error;
    }
  }

  async update(id: string, updateCityDto: UpdateCityDto) {
    try {
      // First check if city exists
      const existingCity = await this.prisma.city.findUnique({
        where: { id },
      });

      if (!existingCity) {
        throw new EntityNotFoundException('City', id);
      }

      // Proceed with update
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
      // First check if city exists
      const existingCity = await this.prisma.city.findUnique({
        where: { id },
      });

      if (!existingCity) {
        throw new EntityNotFoundException('City', id);
      }

      // Proceed with deletion
      const city = await this.prisma.city.delete({
        where: { id },
        include: {
          country: true,
        },
      });

      return city;
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      // Otherwise let the global exception filter handle it
      throw error;
    }
  }

  private localizeCity(city: any, lang: string) {
    const result = { ...city };

    // Set name based on language
    result.name =
      city[`name${lang.charAt(0).toUpperCase() + lang.slice(1)}`] ||
      city.nameUz ||
      city.nameRu;

    // Set description based on language
    result.description =
      city[`description${lang.charAt(0).toUpperCase() + lang.slice(1)}`] ||
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
    result.name =
      country[`name${lang.charAt(0).toUpperCase() + lang.slice(1)}`] ||
      country.nameUz ||
      country.nameRu;

    // Set description based on language
    result.description =
      country[`description${lang.charAt(0).toUpperCase() + lang.slice(1)}`] ||
      country.descriptionUz ||
      country.descriptionRu;

    return result;
  }
}
