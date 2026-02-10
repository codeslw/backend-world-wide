import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
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
import { CountryResponseDto } from './dto/country-response.dto';

@Injectable()
export class CountriesService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService,
  ) {}

  async create(createCountryDto: CreateCountryDto) {
    try {
      // Validate isMain limit if setting country as main
      if (createCountryDto.isMain) {
        await this.validateIsMainLimit();
      }

      // Validate photoUrl is required when isMain is true
      if (createCountryDto.isMain && !createCountryDto.photoUrl) {
        throw new InvalidDataException('photoUrl is required when isMain is true');
      }

      return this.prisma.country.create({
        data: {
          code: createCountryDto.code,
          nameUz: createCountryDto.nameUz,
          nameRu: createCountryDto.nameRu,
          nameEn: createCountryDto.nameEn,
          isMain: createCountryDto.isMain || false,
          photoUrl: createCountryDto.photoUrl,

          // General Info
          overviewEn: createCountryDto.overviewEn,
          overviewRu: createCountryDto.overviewRu,
          overviewUz: createCountryDto.overviewUz,
          images: createCountryDto.images || [],

          // Financial Requirements
          proofOfFundsAmount: createCountryDto.proofOfFundsAmount,
          tuitionMin: createCountryDto.tuitionMin,
          tuitionMax: createCountryDto.tuitionMax,
          tuitionCurrency: createCountryDto.tuitionCurrency,
          costOfLivingMin: createCountryDto.costOfLivingMin,
          costOfLivingMax: createCountryDto.costOfLivingMax,
          costOfLivingCurrency: createCountryDto.costOfLivingCurrency,
          scholarshipAvailability: createCountryDto.scholarshipAvailability,

          // Visa & Immigration
          visaAcceptanceRate: createCountryDto.visaAcceptanceRate,
          visaProcessingTime: createCountryDto.visaProcessingTime,
          visaInterviewRequired: createCountryDto.visaInterviewRequired || false,
          dependentVisaAvailable: createCountryDto.dependentVisaAvailable || false,

          // Work Rights
          partTimeWorkHours: createCountryDto.partTimeWorkHours,
          postStudyWorkDuration: createCountryDto.postStudyWorkDuration,
          prPathwayAvailable: createCountryDto.prPathwayAvailable || false,

          // Academic & Logistical
          majorIntakes: createCountryDto.majorIntakes || [],
          applicationTimeline: createCountryDto.applicationTimeline,
          acceptedLanguageTests: createCountryDto.acceptedLanguageTests || [],
          standardizedTestsRequired: createCountryDto.standardizedTestsRequired,
          gapAcceptance: createCountryDto.gapAcceptance,

          // Life & Experience
          accommodationTypes: createCountryDto.accommodationTypes || [],
          averageRentMin: createCountryDto.averageRentMin,
          averageRentMax: createCountryDto.averageRentMax,
          rentCurrency: createCountryDto.rentCurrency,
          safetyIndex: createCountryDto.safetyIndex,
          healthcareDetails: createCountryDto.healthcareDetails,
          internationalStudentPopulation: createCountryDto.internationalStudentPopulation,
          hasHalalFood: createCountryDto.hasHalalFood || false,
          hasVegetarianFood: createCountryDto.hasVegetarianFood || false,
        },
      });
    } catch (error) {
      // Let the global exception filter handle Prisma errors
      throw error;
    }
  }

  async createMany(countries: CreateCountryDto[]) {
    try {
      const createdCountries = await Promise.all(
        countries.map((countryDto) => {
          return this.create(countryDto);
        }),
      );

      return {
        count: createdCountries.length,
        countries: createdCountries,
      };
    } catch (error) {
      // Let the global exception filter handle Prisma errors
      throw error;
    }
  }

  async findAll(lang: string = 'uz', paginationDto?: PaginationDto) {
    try {
      console.log('🔍 Debug findAll - paginationDto:', paginationDto);

      // Define the ONLY valid search fields for Country model
      const validCountryFields = ['nameUz', 'nameRu', 'nameEn'];

      // Defensive check - ensure no description fields are accidentally included
      const safeSearchFields = validCountryFields.filter(
        (field) =>
          !field.includes('description') && !field.includes('Description'),
      );

      console.log('🔍 Safe search fields for Country:', safeSearchFields);

      // Define filter options
      const filterOptions = {
        filters: [
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
            field: 'code',
            queryParam: 'codes',
            operator: 'in',
            isArray: true,
          },
        ],
        searchFields: safeSearchFields,
        searchMode: 'contains',
        caseSensitive: false,
      };

      console.log(
        '🔍 Debug findAll - searchFields:',
        filterOptions.searchFields,
      );
      console.log(
        '🔍 Debug findAll - filterOptions:',
        JSON.stringify(filterOptions, null, 2),
      );

      // Build filter query with extra safety
      let where: any;
      try {
        where = this.filterService.buildFilterQuery(
          paginationDto || {},
          filterOptions as FilterOptions,
        );
        console.log('🔍 Debug findAll - where clause generated successfully');
      } catch (filterError) {
        console.error('🚨 Error building filter query:', filterError);
        // Fallback to basic query without search
        where = {};
      }

      console.log(
        '🔍 Debug findAll - where clause:',
        JSON.stringify(where, null, 2),
      );

      // Validate where clause doesn't contain description fields
      const whereStr = JSON.stringify(where);
      if (whereStr.includes('description')) {
        console.error(
          '🚨 CRITICAL: WHERE clause contains description fields!',
          where,
        );
        // Remove any OR clauses that might contain description fields
        if (where.OR) {
          where.OR = where.OR.filter((condition: any) => {
            const conditionStr = JSON.stringify(condition);
            return !conditionStr.includes('description');
          });
          if (where.OR.length === 0) {
            delete where.OR;
          }
        }
        console.log('🔧 Cleaned where clause:', JSON.stringify(where, null, 2));
      }

      // Define pagination options
      const paginationOptions = {
        defaultLimit: 10,
        maxLimit: 300,
        defaultSortField: 'nameUz',
        defaultSortDirection: 'asc',
      };

      // Apply pagination and get results with extra error handling
      let result: any;
      try {
        result = await this.filterService.applyPagination(
          this.prisma.country,
          where,
          paginationDto,
          { cities: false },
          undefined,
          paginationOptions as PaginationOptions,
        );
        console.log('🔍 Debug findAll - result count:', result.data.length);
      } catch (paginationError) {
        console.error('🚨 Error in applyPagination:', paginationError);
        console.error(
          '🚨 Where clause that caused error:',
          JSON.stringify(where, null, 2),
        );
        console.error(
          '🚨 Pagination DTO:',
          JSON.stringify(paginationDto, null, 2),
        );

        // Fallback to basic pagination without filters
        try {
          result = await this.filterService.applyPagination(
            this.prisma.country,
            {}, // Empty where clause
            paginationDto,
            { cities: false },
            undefined,
            paginationOptions as PaginationOptions,
          );
          console.log(
            '🔧 Fallback query succeeded with result count:',
            result.data.length,
          );
        } catch (fallbackError) {
          console.error('🚨 Even fallback query failed:', fallbackError);
          throw fallbackError;
        }
      }

      // Localize results
      const localizedData = result.data.map((country) =>
        this.localizeCountry(country, lang),
      );

      return {
        data: localizedData,
        meta: result.meta,
      };
    } catch (error) {
      console.error('🚨 Error in CountriesService.findAll:', error);
      console.error('🚨 Input parameters:', { lang, paginationDto });
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
        where: { code },
      });

      if (!country) {
        throw new EntityNotFoundException('Country', code);
      }

      // Validate isMain limit if setting country as main and it's not already main
      if (updateCountryDto.isMain && !country.isMain) {
        await this.validateIsMainLimit();
      }

      // Validate photoUrl is required when isMain is true
      if (updateCountryDto.isMain && !updateCountryDto.photoUrl && !country.photoUrl) {
        throw new InvalidDataException('photoUrl is required when isMain is true');
      }

      // Build update data object, only including fields that are provided
      const updateData: any = {};

      // Basic fields
      if (updateCountryDto.nameUz !== undefined) updateData.nameUz = updateCountryDto.nameUz;
      if (updateCountryDto.nameRu !== undefined) updateData.nameRu = updateCountryDto.nameRu;
      if (updateCountryDto.nameEn !== undefined) updateData.nameEn = updateCountryDto.nameEn;
      if (updateCountryDto.isMain !== undefined) updateData.isMain = updateCountryDto.isMain;
      if (updateCountryDto.photoUrl !== undefined) updateData.photoUrl = updateCountryDto.photoUrl;

      // General Info
      if (updateCountryDto.overviewEn !== undefined) updateData.overviewEn = updateCountryDto.overviewEn;
      if (updateCountryDto.overviewRu !== undefined) updateData.overviewRu = updateCountryDto.overviewRu;
      if (updateCountryDto.overviewUz !== undefined) updateData.overviewUz = updateCountryDto.overviewUz;
      if (updateCountryDto.images !== undefined) updateData.images = updateCountryDto.images;

      // Financial Requirements
      if (updateCountryDto.proofOfFundsAmount !== undefined) updateData.proofOfFundsAmount = updateCountryDto.proofOfFundsAmount;
      if (updateCountryDto.tuitionMin !== undefined) updateData.tuitionMin = updateCountryDto.tuitionMin;
      if (updateCountryDto.tuitionMax !== undefined) updateData.tuitionMax = updateCountryDto.tuitionMax;
      if (updateCountryDto.tuitionCurrency !== undefined) updateData.tuitionCurrency = updateCountryDto.tuitionCurrency;
      if (updateCountryDto.costOfLivingMin !== undefined) updateData.costOfLivingMin = updateCountryDto.costOfLivingMin;
      if (updateCountryDto.costOfLivingMax !== undefined) updateData.costOfLivingMax = updateCountryDto.costOfLivingMax;
      if (updateCountryDto.costOfLivingCurrency !== undefined) updateData.costOfLivingCurrency = updateCountryDto.costOfLivingCurrency;
      if (updateCountryDto.scholarshipAvailability !== undefined) updateData.scholarshipAvailability = updateCountryDto.scholarshipAvailability;

      // Visa & Immigration
      if (updateCountryDto.visaAcceptanceRate !== undefined) updateData.visaAcceptanceRate = updateCountryDto.visaAcceptanceRate;
      if (updateCountryDto.visaProcessingTime !== undefined) updateData.visaProcessingTime = updateCountryDto.visaProcessingTime;
      if (updateCountryDto.visaInterviewRequired !== undefined) updateData.visaInterviewRequired = updateCountryDto.visaInterviewRequired;
      if (updateCountryDto.dependentVisaAvailable !== undefined) updateData.dependentVisaAvailable = updateCountryDto.dependentVisaAvailable;

      // Work Rights
      if (updateCountryDto.partTimeWorkHours !== undefined) updateData.partTimeWorkHours = updateCountryDto.partTimeWorkHours;
      if (updateCountryDto.postStudyWorkDuration !== undefined) updateData.postStudyWorkDuration = updateCountryDto.postStudyWorkDuration;
      if (updateCountryDto.prPathwayAvailable !== undefined) updateData.prPathwayAvailable = updateCountryDto.prPathwayAvailable;

      // Academic & Logistical
      if (updateCountryDto.majorIntakes !== undefined) updateData.majorIntakes = updateCountryDto.majorIntakes;
      if (updateCountryDto.applicationTimeline !== undefined) updateData.applicationTimeline = updateCountryDto.applicationTimeline;
      if (updateCountryDto.acceptedLanguageTests !== undefined) updateData.acceptedLanguageTests = updateCountryDto.acceptedLanguageTests;
      if (updateCountryDto.standardizedTestsRequired !== undefined) updateData.standardizedTestsRequired = updateCountryDto.standardizedTestsRequired;
      if (updateCountryDto.gapAcceptance !== undefined) updateData.gapAcceptance = updateCountryDto.gapAcceptance;

      // Life & Experience
      if (updateCountryDto.accommodationTypes !== undefined) updateData.accommodationTypes = updateCountryDto.accommodationTypes;
      if (updateCountryDto.averageRentMin !== undefined) updateData.averageRentMin = updateCountryDto.averageRentMin;
      if (updateCountryDto.averageRentMax !== undefined) updateData.averageRentMax = updateCountryDto.averageRentMax;
      if (updateCountryDto.rentCurrency !== undefined) updateData.rentCurrency = updateCountryDto.rentCurrency;
      if (updateCountryDto.safetyIndex !== undefined) updateData.safetyIndex = updateCountryDto.safetyIndex;
      if (updateCountryDto.healthcareDetails !== undefined) updateData.healthcareDetails = updateCountryDto.healthcareDetails;
      if (updateCountryDto.internationalStudentPopulation !== undefined) updateData.internationalStudentPopulation = updateCountryDto.internationalStudentPopulation;
      if (updateCountryDto.hasHalalFood !== undefined) updateData.hasHalalFood = updateCountryDto.hasHalalFood;
      if (updateCountryDto.hasVegetarianFood !== undefined) updateData.hasVegetarianFood = updateCountryDto.hasVegetarianFood;

      // Proceed with update
      return await this.prisma.country.update({
        where: { code },
        data: updateData,
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
        where: { code },
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

    // Set localized name based on language preference
    result.name =
      country[`name${lang.charAt(0).toUpperCase() + lang.slice(1)}`] ||
      country.nameUz ||
      country.nameRu ||
      country.nameEn;

    // Localize cities if they exist (cities have description fields)
    if (result.cities && result.cities.length > 0) {
      result.cities = result.cities.map((city) => {
        const localizedCity = { ...city };
        localizedCity.name =
          city[`name${lang.charAt(0).toUpperCase() + lang.slice(1)}`] ||
          city.nameUz ||
          city.nameRu ||
          city.nameEn;
        // Cities do have description fields
        localizedCity.description =
          city[`description${lang.charAt(0).toUpperCase() + lang.slice(1)}`] ||
          city.descriptionUz ||
          city.descriptionRu ||
          city.descriptionEn;
        return localizedCity;
      });
    }

    return result;
  }

  private async validateIsMainLimit(): Promise<void> {
    const count = await this.prisma.country.count({
      where: { isMain: true }
    });

    if (count >= 3) {
      throw new InvalidDataException('Cannot set as main: maximum of 3 countries can be marked as main');
    }
  }

  async findMainCountries(lang: string = 'uz'): Promise<CountryResponseDto[]> {
    try {
      const countries = await this.prisma.country.findMany({
        where: { isMain: true },
        take: 3,
        orderBy: { code: 'asc' },
      });

      return countries.map((country) => this.localizeCountry(country, lang));
    } catch (error) {
      console.error('Error finding main countries:', error);
      throw error;
    }
  }
}
