import { Injectable } from '@nestjs/common';
import { CitiesService } from '../cities/cities.service';
import { CountriesService } from '../countries/countries.service';
import { ProgramsService } from '../programs/programs.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class CatalogService {
  constructor(
    private readonly countriesService: CountriesService,
    private readonly citiesService: CitiesService,
    private readonly programsService: ProgramsService,
  ) {}

  async getCountries(lang: string = 'uz', paginationDto?: PaginationDto) {
    return this.countriesService.findAll(lang, paginationDto);
  }

  async getCountry(code: number, lang: string = 'uz') {
    return this.countriesService.findOne(code, lang);
  }

  async getCities(countryCode?: number, lang: string = 'uz', paginationDto?: PaginationDto) {
    return this.citiesService.findAll(countryCode, lang, paginationDto);
  }

  async getCity(id: string, lang: string = 'uz') {
    return this.citiesService.findOne(id, lang);
  }

  async getPrograms(parentId?: string, lang: string = 'uz', paginationDto?: PaginationDto) {
    return this.programsService.findAll(parentId, lang, paginationDto);
  }

  async getProgram(id: string, lang: string = 'uz') {
    return this.programsService.findOne(id, lang);
  }

  async getRootPrograms(lang: string = 'uz', paginationDto?: PaginationDto) {
    // Only get programs that don't have a parent (root programs)
    return this.programsService.findAll(null, lang, paginationDto);
  }
} 