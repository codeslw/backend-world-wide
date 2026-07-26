import { Injectable } from '@nestjs/common';
import { CitiesService } from '../cities/cities.service';
import { CountriesService } from '../countries/countries.service';
import { FacultiesService } from '../faculties/faculties.service';
import { DepartmentsService } from '../departments/departments.service';
import { QueryFacultyDto } from '../faculties/dto/query-faculty.dto';
import { QueryDepartmentDto } from '../departments/dto/query-department.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { StudyLanguagesService } from '../study-languages/study-languages.service';

@Injectable()
export class CatalogService {
  constructor(
    private readonly countriesService: CountriesService,
    private readonly citiesService: CitiesService,
    private readonly facultiesService: FacultiesService,
    private readonly departmentsService: DepartmentsService,
    private readonly studyLanguagesService: StudyLanguagesService,
  ) {}

  async getCountries(lang: string = 'uz', paginationDto?: PaginationDto) {
    return this.countriesService.findAll(lang, paginationDto);
  }

  async getCountry(code: number, lang: string = 'uz') {
    return this.countriesService.findOne(code, lang);
  }

  async getCities(
    lang: string = 'uz',
    page: number = 1,
    limit: number = 10,
    countryCode?: number,
  ) {
    return this.citiesService.findAll(lang, page, limit, countryCode);
  }

  async getCity(id: string, lang: string = 'uz') {
    return this.citiesService.findOne(id, lang);
  }

  /**
   * Faculty taxonomy for catalog filters. Replaces the retired
   * `catalog/programs*` endpoints: the global program catalog is gone, programs
   * now live on UniversityProgram under a University -> Faculty -> Department.
   */
  async getFaculties(query: QueryFacultyDto = {}, lang: string = 'uz') {
    return this.facultiesService.findAll(query, lang);
  }

  /** Department taxonomy for catalog filters (optionally scoped to a faculty). */
  async getDepartments(query: QueryDepartmentDto = {}, lang: string = 'uz') {
    return this.departmentsService.findAll(query, lang);
  }

  async getLanguages() {
    const languages = await this.studyLanguagesService.findAll();
    return languages.map(lang => lang.nameEn).sort(); // For backward compatibility if needed, but we should probably return objects soon.
  }
}
