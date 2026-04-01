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
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class CountriesService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async clearCache() {
    try {
      if (typeof (this.cacheManager as any).reset === 'function') {
        await (this.cacheManager as any).reset();
      } else if (typeof (this.cacheManager as any).clear === 'function') {
        await (this.cacheManager as any).clear();
      } else if (
        typeof (this.cacheManager as any).store?.reset === 'function'
      ) {
        await (this.cacheManager as any).store.reset();
      }
    } catch (e) {
      console.warn('Cache clearing failed', e);
    }
  }

  async create(createCountryDto: CreateCountryDto) {
    try {
      // Validate isMain limit if setting country as main
      if (createCountryDto.isMain) {
        await this.validateIsMainLimit();
      }

      // Validate photoUrl is required when isMain is true
      if (createCountryDto.isMain && !createCountryDto.photoUrl) {
        throw new InvalidDataException(
          'photoUrl is required when isMain is true',
        );
      }

      const createdCountry = await this.prisma.country.create({
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
          visaInterviewRequired:
            createCountryDto.visaInterviewRequired || false,
          dependentVisaAvailable:
            createCountryDto.dependentVisaAvailable || false,
          visaFee: createCountryDto.visaFee,
          visaFeeCurrency: createCountryDto.visaFeeCurrency,
          isVisaFeeRefundable: createCountryDto.isVisaFeeRefundable || false,
          insuranceFee: createCountryDto.insuranceFee,
          insuranceFeeCurrency: createCountryDto.insuranceFeeCurrency,
          isInsuranceFeeRefundable:
            createCountryDto.isInsuranceFeeRefundable || false,
          bankStatement: createCountryDto.bankStatement,
          otherExpenses: createCountryDto.otherExpenses || [],
          visaRequiredDocuments: createCountryDto.visaRequiredDocuments,

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
          internationalStudentPopulation:
            createCountryDto.internationalStudentPopulation,
          hasHalalFood: createCountryDto.hasHalalFood || false,
          hasVegetarianFood: createCountryDto.hasVegetarianFood || false,
        },
      });
      await this.clearCache();
      return createdCountry;
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

      await this.clearCache();
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
    const cacheKey = `countries:all:${lang}:${JSON.stringify(paginationDto)}`;
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    try {
      const safeSearchFields = ['nameUz', 'nameRu', 'nameEn'];

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

      let where: any;
      try {
        where = this.filterService.buildFilterQuery(
          paginationDto || {},
          filterOptions as FilterOptions,
        );
      } catch (filterError) {
        where = {};
      }

      // Sanitize where clause from description fields
      const whereStr = JSON.stringify(where);
      if (whereStr.includes('description')) {
        if (where.OR) {
          where.OR = where.OR.filter((condition: any) => {
            const conditionStr = JSON.stringify(condition);
            return !conditionStr.includes('description');
          });
          if (where.OR.length === 0) {
            delete where.OR;
          }
        }
      }

      const paginationOptions = {
        defaultLimit: 10,
        maxLimit: 300,
        defaultSortField: 'nameUz',
        defaultSortDirection: 'asc',
      };

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
      } catch (paginationError) {
        result = await this.filterService.applyPagination(
          this.prisma.country,
          {},
          paginationDto,
          { cities: false },
          undefined,
          paginationOptions as PaginationOptions,
        );
      }

      // Localize results
      const localizedData = result.data.map((country) =>
        this.localizeCountry(country, lang),
      );

      const finalResult = {
        data: localizedData,
        meta: result.meta,
      };
      await this.cacheManager.set(cacheKey, finalResult);
      return finalResult;
    } catch (error) {
      throw error;
    }
  }

  async findOne(code: number, lang: string = 'uz') {
    const cacheKey = `countries:one:${code}:${lang}`;
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

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

      const result = this.localizeCountry(country, lang);
      await this.cacheManager.set(cacheKey, result);
      return result;
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
      if (
        updateCountryDto.isMain &&
        !updateCountryDto.photoUrl &&
        !country.photoUrl
      ) {
        throw new InvalidDataException(
          'photoUrl is required when isMain is true',
        );
      }

      // Build update data object, only including fields that are provided
      const updateData: any = {};

      // Basic fields
      if (updateCountryDto.nameUz !== undefined)
        updateData.nameUz = updateCountryDto.nameUz;
      if (updateCountryDto.nameRu !== undefined)
        updateData.nameRu = updateCountryDto.nameRu;
      if (updateCountryDto.nameEn !== undefined)
        updateData.nameEn = updateCountryDto.nameEn;
      if (updateCountryDto.isMain !== undefined)
        updateData.isMain = updateCountryDto.isMain;
      if (updateCountryDto.photoUrl !== undefined)
        updateData.photoUrl = updateCountryDto.photoUrl;

      // General Info
      if (updateCountryDto.overviewEn !== undefined)
        updateData.overviewEn = updateCountryDto.overviewEn;
      if (updateCountryDto.overviewRu !== undefined)
        updateData.overviewRu = updateCountryDto.overviewRu;
      if (updateCountryDto.overviewUz !== undefined)
        updateData.overviewUz = updateCountryDto.overviewUz;
      if (updateCountryDto.images !== undefined)
        updateData.images = updateCountryDto.images;

      // Financial Requirements
      if (updateCountryDto.proofOfFundsAmount !== undefined)
        updateData.proofOfFundsAmount = updateCountryDto.proofOfFundsAmount;
      if (updateCountryDto.tuitionMin !== undefined)
        updateData.tuitionMin = updateCountryDto.tuitionMin;
      if (updateCountryDto.tuitionMax !== undefined)
        updateData.tuitionMax = updateCountryDto.tuitionMax;
      if (updateCountryDto.tuitionCurrency !== undefined)
        updateData.tuitionCurrency = updateCountryDto.tuitionCurrency;
      if (updateCountryDto.costOfLivingMin !== undefined)
        updateData.costOfLivingMin = updateCountryDto.costOfLivingMin;
      if (updateCountryDto.costOfLivingMax !== undefined)
        updateData.costOfLivingMax = updateCountryDto.costOfLivingMax;
      if (updateCountryDto.costOfLivingCurrency !== undefined)
        updateData.costOfLivingCurrency = updateCountryDto.costOfLivingCurrency;
      if (updateCountryDto.scholarshipAvailability !== undefined)
        updateData.scholarshipAvailability =
          updateCountryDto.scholarshipAvailability;

      // Visa & Immigration
      if (updateCountryDto.visaAcceptanceRate !== undefined)
        updateData.visaAcceptanceRate = updateCountryDto.visaAcceptanceRate;
      if (updateCountryDto.visaProcessingTime !== undefined)
        updateData.visaProcessingTime = updateCountryDto.visaProcessingTime;
      if (updateCountryDto.visaInterviewRequired !== undefined)
        updateData.visaInterviewRequired =
          updateCountryDto.visaInterviewRequired;
      if (updateCountryDto.dependentVisaAvailable !== undefined)
        updateData.dependentVisaAvailable =
          updateCountryDto.dependentVisaAvailable;
      if (updateCountryDto.visaFee !== undefined)
        updateData.visaFee = updateCountryDto.visaFee;
      if (updateCountryDto.visaFeeCurrency !== undefined)
        updateData.visaFeeCurrency = updateCountryDto.visaFeeCurrency;
      if (updateCountryDto.isVisaFeeRefundable !== undefined)
        updateData.isVisaFeeRefundable = updateCountryDto.isVisaFeeRefundable;
      if (updateCountryDto.insuranceFee !== undefined)
        updateData.insuranceFee = updateCountryDto.insuranceFee;
      if (updateCountryDto.insuranceFeeCurrency !== undefined)
        updateData.insuranceFeeCurrency = updateCountryDto.insuranceFeeCurrency;
      if (updateCountryDto.isInsuranceFeeRefundable !== undefined)
        updateData.isInsuranceFeeRefundable =
          updateCountryDto.isInsuranceFeeRefundable;
      if (updateCountryDto.bankStatement !== undefined)
        updateData.bankStatement = updateCountryDto.bankStatement;
      if (updateCountryDto.otherExpenses !== undefined)
        updateData.otherExpenses = updateCountryDto.otherExpenses;
      if (updateCountryDto.visaRequiredDocuments !== undefined)
        updateData.visaRequiredDocuments =
          updateCountryDto.visaRequiredDocuments;

      // Work Rights
      if (updateCountryDto.partTimeWorkHours !== undefined)
        updateData.partTimeWorkHours = updateCountryDto.partTimeWorkHours;
      if (updateCountryDto.postStudyWorkDuration !== undefined)
        updateData.postStudyWorkDuration =
          updateCountryDto.postStudyWorkDuration;
      if (updateCountryDto.prPathwayAvailable !== undefined)
        updateData.prPathwayAvailable = updateCountryDto.prPathwayAvailable;

      // Academic & Logistical
      if (updateCountryDto.majorIntakes !== undefined)
        updateData.majorIntakes = updateCountryDto.majorIntakes;
      if (updateCountryDto.applicationTimeline !== undefined)
        updateData.applicationTimeline = updateCountryDto.applicationTimeline;
      if (updateCountryDto.acceptedLanguageTests !== undefined)
        updateData.acceptedLanguageTests =
          updateCountryDto.acceptedLanguageTests;
      if (updateCountryDto.standardizedTestsRequired !== undefined)
        updateData.standardizedTestsRequired =
          updateCountryDto.standardizedTestsRequired;
      if (updateCountryDto.gapAcceptance !== undefined)
        updateData.gapAcceptance = updateCountryDto.gapAcceptance;

      // Life & Experience
      if (updateCountryDto.accommodationTypes !== undefined)
        updateData.accommodationTypes = updateCountryDto.accommodationTypes;
      if (updateCountryDto.averageRentMin !== undefined)
        updateData.averageRentMin = updateCountryDto.averageRentMin;
      if (updateCountryDto.averageRentMax !== undefined)
        updateData.averageRentMax = updateCountryDto.averageRentMax;
      if (updateCountryDto.rentCurrency !== undefined)
        updateData.rentCurrency = updateCountryDto.rentCurrency;
      if (updateCountryDto.safetyIndex !== undefined)
        updateData.safetyIndex = updateCountryDto.safetyIndex;
      if (updateCountryDto.healthcareDetails !== undefined)
        updateData.healthcareDetails = updateCountryDto.healthcareDetails;
      if (updateCountryDto.internationalStudentPopulation !== undefined)
        updateData.internationalStudentPopulation =
          updateCountryDto.internationalStudentPopulation;
      if (updateCountryDto.hasHalalFood !== undefined)
        updateData.hasHalalFood = updateCountryDto.hasHalalFood;
      if (updateCountryDto.hasVegetarianFood !== undefined)
        updateData.hasVegetarianFood = updateCountryDto.hasVegetarianFood;

      // Proceed with update
      const updatedCountry = await this.prisma.country.update({
        where: { code },
        data: updateData,
      });
      await this.clearCache();
      return updatedCountry;
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
      const deletedCountry = await this.prisma.country.delete({
        where: { code },
      });
      await this.clearCache();
      return deletedCountry;
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
      where: { isMain: true },
    });

    if (count >= 3) {
      throw new InvalidDataException(
        'Cannot set as main: maximum of 3 countries can be marked as main',
      );
    }
  }

  async findMainCountries(lang: string = 'uz'): Promise<CountryResponseDto[]> {
    const cacheKey = `countries:main:${lang}`;
    const cached = await this.cacheManager.get<CountryResponseDto[]>(cacheKey);
    if (cached) return cached;

    try {
      const countries = await this.prisma.country.findMany({
        take: 3,
        orderBy: [
          {
            universities: {
              _count: 'desc',
            },
          },
          {
            nameEn: 'asc',
          },
        ],
        include: {
          _count: {
            select: {
              universities: true,
            },
          },
        },
      });

      const result = countries.map((country) => {
        const localizedCountry = this.localizeCountry(country, lang);
        return {
          ...localizedCountry,
          universitiesCount: country._count.universities,
        };
      });
      await this.cacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error finding top countries:', error);
      throw error;
    }
  }
}
